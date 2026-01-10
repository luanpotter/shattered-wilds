export interface OmniBoxOption {
	type: OmniBoxOptionType;
	label: string;
	action: () => void;
}

export enum OmniBoxOptionType {
	Context = 'Context',
	Navigation = 'Navigation',
	Act = 'Act',
	Lexicon = 'Lexicon',
	Misc = 'Misc',
}
