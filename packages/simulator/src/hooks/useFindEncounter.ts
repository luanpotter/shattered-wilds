import { useStore } from '../store';
import { Encounter } from '../types/ui';

export const useFindEncounter = (): ((encounterId: string | undefined) => Encounter | undefined) => {
	const encounters = useStore(state => state.encounters);
	return (encounterId: string | undefined) => {
		if (encounterId === undefined) {
			return undefined;
		}
		return encounters.find(e => e.id === encounterId);
	};
};
