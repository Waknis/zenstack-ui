import { ActionIcon, Modal } from '@mantine/core';
import { useDisclosure, useHotkeys } from '@mantine/hooks';
import { LuPlus } from 'react-icons/lu';

import { ZSCreateForm } from '~zenstack-ui/form/form';
import type { ZSFormOverrideProps } from '~zenstack-ui/index';

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
			<div className="mb-2 mt-3 flex items-center justify-between font-semibold">
				<p className="text-lg font-semibold">{title}</p>
				<ActionIcon size="sm" variant="light" onClick={openCreateModal}>
					<LuPlus size={12} />
				</ActionIcon>
			</div>
		</>
	);
}
