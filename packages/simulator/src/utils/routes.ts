export enum Route {
	Home = 'home',
	NotFound = '404',
	Characters = 'characters',
	Character = 'character',
	PrintSheet = 'print-sheet',
	Encounters = 'encounters',
	Encounter = 'encounter',
	PrintActions = 'print-actions',
	Onboarding = 'onboarding',
}

export interface RouteDefinition<R extends Route, Path extends string> {
	route: R;
	label: string;
	path: Path;
}

export const ROUTES = {
	[Route.NotFound]: {
		route: Route.NotFound,
		label: 'Not Found',
		path: '/404',
	},

	[Route.Home]: {
		route: Route.Home,
		label: 'Home',
		path: '/',
	},

	[Route.Characters]: {
		route: Route.Characters,
		label: 'Characters',
		path: '/characters',
	},

	[Route.Character]: {
		route: Route.Character,
		label: 'Character Sheet',
		path: '/characters/:characterId',
	},

	[Route.PrintSheet]: {
		route: Route.PrintSheet,
		label: 'Print Character',
		path: '/characters/:characterId/print',
	},

	[Route.Encounters]: {
		route: Route.Encounters,
		label: 'Encounters',
		path: '/encounters',
	},

	[Route.Encounter]: {
		route: Route.Encounter,
		label: 'Encounter',
		path: '/encounters/:encounterId',
	},

	[Route.PrintActions]: {
		route: Route.PrintActions,
		label: 'Print Actions',
		path: '/print/actions',
	},

	[Route.Onboarding]: {
		route: Route.Onboarding,
		label: 'Onboarding',
		path: '/onboarding',
	},
} as const;

// Extract parameter names from a path pattern like "/characters/:characterId/print"
type ExtractParams<Path extends string> = Path extends `${string}:${infer Param}/${infer Rest}`
	? Param | ExtractParams<`/${Rest}`>
	: Path extends `${string}:${infer Param}`
		? Param
		: never;

// Convert param names to an object type { paramName: string }
type ParamsObject<Path extends string> =
	ExtractParams<Path> extends never ? void : { [K in ExtractParams<Path>]: string };

// Type helper to extract params for a route
type RouteParamsFor<R extends Route> = ParamsObject<(typeof ROUTES)[R]['path']>;

// Parsed route state - discriminating union based on route
export type RouteState =
	| { route: Route.Home }
	| { route: Route.NotFound }
	| { route: Route.Characters }
	| { route: Route.Character; characterId: string }
	| { route: Route.PrintSheet; characterId: string }
	| { route: Route.Encounters }
	| { route: Route.Encounter; encounterId: string }
	| { route: Route.PrintActions }
	| { route: Route.Onboarding };

// Convert path pattern to regex and extract param names
function pathToRegex(path: string): { regex: RegExp; paramNames: string[] } {
	const paramNames: string[] = [];
	const regexStr = path.replace(/:([^/]+)/g, (_, paramName) => {
		paramNames.push(paramName);
		return '([^/]+)';
	});
	return { regex: new RegExp(`^${regexStr}$`), paramNames };
}

// Try to match a hash against a route definition
function matchRoute(hash: string, route: Route): Record<string, string> | true | null {
	const def = ROUTES[route];
	const { regex, paramNames } = pathToRegex(def.path);
	const match = hash.match(regex);

	if (!match) return null;
	if (paramNames.length === 0) return true;

	const params: Record<string, string> = {};
	paramNames.forEach((name, i) => {
		params[name] = match[i + 1];
	});
	return params;
}

// Order matters for matching - more specific routes first (longer paths)
const MATCH_ORDER: Route[] = Object.values(Route)
	.filter(r => r !== Route.NotFound)
	.sort((a, b) => ROUTES[b].path.length - ROUTES[a].path.length);

// Routes that have no parameters
type RoutesWithParams = {
	[R in Route]: RouteParamsFor<R> extends void ? never : R;
}[Route];
type RoutesWithoutParams = Exclude<Route, RoutesWithParams>;

// Build path from pattern and params
function buildPath(pattern: string, params?: Record<string, string>): string {
	if (!params) return pattern;
	return pattern.replace(/:([^/]+)/g, (_, paramName) => params[paramName] ?? '');
}

/** Navigate to a route - type-safe based on whether route requires params */
function navigateToRoute<R extends RoutesWithoutParams>(route: R): void;
function navigateToRoute<R extends RoutesWithParams>(route: R, params: RouteParamsFor<R>): void;
function navigateToRoute(route: Route, params?: Record<string, string>): void {
	const def = ROUTES[route];
	const path = buildPath(def.path, params);
	window.location.hash = `#${path}`;
}

/** Get the path for a route (useful for links) */
function getPath<R extends RoutesWithoutParams>(route: R): string;
function getPath<R extends RoutesWithParams>(route: R, params: RouteParamsFor<R>): string;
function getPath(route: Route, params?: Record<string, string>): string {
	const def = ROUTES[route];
	return buildPath(def.path, params);
}

const findRoute = (hash: string): RouteState => {
	for (const route of MATCH_ORDER) {
		const result = matchRoute(hash, route);
		if (result !== null) {
			if (result === true) {
				return { route } as RouteState;
			}
			return { route, ...result } as RouteState;
		}
	}

	return { route: Route.NotFound };
};

export const Navigator = {
	/** Parse the current URL hash into a RouteState */
	parseRoute(): RouteState {
		const hash = window.location.hash.slice(1) || '/';
		return findRoute(hash);
	},

	/** Navigate to a route - type-safe based on whether route requires params */
	to: navigateToRoute,

	/** Get the path for a route (useful for links) */
	getPath: getPath,

	/** Navigate to the main site (outside the simulator) */
	toSite(): void {
		window.location.pathname = '/';
	},

	/** Get all navigable routes (excludes 404) */
	getNavigableRoutes(): Route[] {
		return Object.values(Route).filter(r => r !== Route.NotFound);
	},
} as const;
