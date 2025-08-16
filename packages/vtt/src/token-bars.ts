// Helper function to configure default token bars for Bar Brawl
export async function configureDefaultTokenBars(actor: unknown): Promise<void> {
	try {
		const actorWithPrototype = actor as {
			prototypeToken?: {
				flags?: Record<string, unknown>;
				update?: (data: Record<string, unknown>) => Promise<unknown>;
			};
			update?: (data: Record<string, unknown>) => Promise<unknown>;
		};

		// Check if Bar Brawl bars are already configured
		const barBrawlFlags = actorWithPrototype.prototypeToken?.flags?.['barbrawl'] as
			| { resourceBars?: unknown[] }
			| undefined;

		// Only configure if not already set up
		if (!barBrawlFlags?.resourceBars || barBrawlFlags.resourceBars.length === 0) {
			const defaultBars = [
				{
					id: 'vp-bar',
					attribute: 'system.resources.vp.value',
					maxAttribute: 'system.resources.vp.max',
					minColor: '#ff0000',
					maxColor: '#00ff00',
					position: 'bottom-inner',
					order: 0,
					ownerVisibility: 'ALWAYS',
					otherVisibility: 'ALWAYS',
					indentation: 0,
					showMaxValue: true,
					showLabel: false,
				},
				{
					id: 'fp-bar',
					attribute: 'system.resources.fp.value',
					maxAttribute: 'system.resources.fp.max',
					minColor: '#000080',
					maxColor: '#87ceeb',
					position: 'bottom-inner',
					order: 1,
					ownerVisibility: 'ALWAYS',
					otherVisibility: 'ALWAYS',
					indentation: 0,
					showMaxValue: true,
					showLabel: false,
				},
				{
					id: 'sp-bar',
					attribute: 'system.resources.sp.value',
					maxAttribute: 'system.resources.sp.max',
					minColor: '#800080',
					maxColor: '#ffd700',
					position: 'bottom-inner',
					order: 2,
					ownerVisibility: 'ALWAYS',
					otherVisibility: 'ALWAYS',
					indentation: 0,
					showMaxValue: true,
					showLabel: false,
				},
			];

			// Update the prototype token with Bar Brawl configuration
			if (actorWithPrototype.update) {
				await actorWithPrototype.update({
					'prototypeToken.flags.barbrawl.resourceBars': defaultBars,
				});
			}
		}
	} catch (err) {
		// Bar Brawl might not be installed, fail silently
		console.debug('Failed to configure token bars (Bar Brawl may not be installed):', err);
	}
}
