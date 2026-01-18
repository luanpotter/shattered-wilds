import { CharacterSheet } from '@shattered-wilds/d12';

import { Aelric } from './characters/aelric';
import { Bikk } from './characters/bikk';
import { Cedric } from './characters/cedric';
import { Freya } from './characters/freya';
import { Hank } from './characters/hank';
import { Miriel } from './characters/miriel';
import { Revia } from './characters/revia';
import { Yornna } from './characters/yornna';
import { Zigog } from './characters/zigog';

const characters = [Revia, Zigog, Hank, Miriel, Yornna, Bikk, Aelric, Freya, Cedric];

export const PREDEFINED_CHARACTERS = {
	...Object.fromEntries(
		characters.map(character => [character.name, CharacterSheet.toShareString(character.toProps())]),
	),
};
