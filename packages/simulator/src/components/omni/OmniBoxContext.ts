import { OmniBoxOptionType } from './OmniBoxOption';

export interface OmniBoxContext {
	type?: OmniBoxOptionType | undefined;
	encounterId?: string | undefined;
	characterId?: string | undefined;
}
