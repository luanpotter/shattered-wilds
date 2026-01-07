import { OmniBoxOptionType } from './OmniBoxOption';

export interface OmniBoxContext {
	type?: OmniBoxOptionType | null;
	encounterId?: string | null;
	characterId?: string | null;
}
