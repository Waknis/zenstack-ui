import { ActionIcon, Modal } from '@mantine/core';
import { useDisclosure, useHotkeys } from '@mantine/hooks';
import { LuPlus } from 'react-icons/lu';

import { ZenstackCreateForm } from '~zenstack-ui/form/form';

export function ListHeader({ title, model }: { title: string, model: string }) {
	useHotkeys([
		['meta+m', () => openCreateModal()],
	]);

	const [
		createModalOpened,
		{ open: openCreateModal, close: closeCreateModal },
	] = useDisclosure(false);

	return (
		<>
			{/* Create Modal */}
			<Modal opened={createModalOpened} onClose={closeCreateModal} title={`Create ${model}`}>
				<ZenstackCreateForm model={model} onSubmit={closeCreateModal} />
			</Modal>

			{/* List Header */}
			<div className="left-list__header">
				<p className="left-list__title">{title}</p>
				<ActionIcon size="sm" variant="light" onClick={openCreateModal}>
					<LuPlus size={12} />
				</ActionIcon>
			</div>
		</>
	);
}
