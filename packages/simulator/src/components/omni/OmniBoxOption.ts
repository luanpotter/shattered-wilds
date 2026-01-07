export interface OmniBoxOption {
	type: OmniBoxOptionType;
	label: string;
	action: () => void;
}

export enum OmniBoxOptionType {
	Navigation,
	Misc,
}
