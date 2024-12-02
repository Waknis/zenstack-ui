import { ActionIcon, Modal } from '@mantine/core';
import { useDisclosure, useHotkeys } from '@mantine/hooks';
import { LuPlus } from 'react-icons/lu';

import { ZSCreateForm, type ZSFormOverrideProps } from '~zenstack-ui/form/form';

interface ListHeaderProps extends ZSFormOverrideProps {
	title: string
	model: string
}

export function ListHeader({ title, model, ...overrideProps }: ListHeaderProps) {
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
				<ZSCreateForm model={model} onSubmit={closeCreateModal} {...overrideProps} />
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
