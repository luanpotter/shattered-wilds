import { useStore } from '../store';
import { Encounter } from '../types/ui';

type FindEncounterHandler = (encounterId: string | undefined) => Encounter | undefined;

export const useEncounters = (): {
	encounters: Encounter[];
	updateEncounter: (encounter: Encounter) => void;
	findEncounter: FindEncounterHandler;
} => {
	const encounters = useStore(state => state.encounters);
	const updateEncounter = useStore(state => state.updateEncounter);

	const findEncounter = (encounterId: string | undefined) => {
		if (encounterId === undefined) {
			return undefined;
		}
		return encounters.find(e => e.id === encounterId);
	};

	return { encounters, updateEncounter, findEncounter };
};
