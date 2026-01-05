import { useModals } from './useModals';

export const useErrors = (): ((message: string) => void) => {
	const { openErrorModal } = useModals();
	return (message: string) => {
		console.error(`Unexpected error!`, message);
		openErrorModal({ message });
	};
};
