/* eslint-disable @typescript-eslint/no-explicit-any */
import { ActionIcon, Button, Modal } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { LuTrash } from 'react-icons/lu';

import type { RouteFullPaths } from '~client/routes/-sidebar';
import type { UseMutationHook } from '~zenstack-ui/metadata';
import { useZenstackUIProvider } from '~zenstack-ui/utils/provider';
import { getIdField, getModelFields } from '~zenstack-ui/utils/utils';

interface DetailHeaderProps {
	model: string
	route: RouteFullPaths
	id: number | string
}

export function DetailHeader(props: DetailHeaderProps) {
	const { hooks, metadata } = useZenstackUIProvider();

	// Delete hook
	const deleteHook = hooks[`useDelete${props.model}`] as UseMutationHook<any>;
	const deleteMutation = deleteHook({ optimisticUpdate: true });

	// Modal state
	const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();

	// Delete handler
	const handleDelete = async () => {
		setLoading(true);
		try {
			const fields = getModelFields(metadata, props.model);
			const idField = getIdField(fields);
			await deleteMutation.mutateAsync({ where: { [idField.name]: props.id } });
			navigate({ to: props.route });
		} finally {
			setLoading(false);
			closeDeleteModal();
		}
	};

	return (
		<>

			{/* Detail Header */}
			<div className="mb-2 flex w-full justify-between gap-2">
				<p className="text-lg font-semibold">{props.model} Details</p>
				<ActionIcon color="red" size="sm" variant="light" onClick={openDeleteModal}>
					<LuTrash size={12} />
				</ActionIcon>
			</div>

			{/* Delete Modal */}
			<Modal opened={deleteModalOpened} onClose={closeDeleteModal} title={`Delete ${props.model}`}>
				<p>Are you sure you want to delete this {props.model.toLowerCase()}?</p>
				<div className="mt-4 flex justify-end gap-4">
					<Button variant="default" onClick={closeDeleteModal}>Cancel</Button>
					<Button variant="filled" color="red" loading={loading} onClick={handleDelete}>Delete</Button>
				</div>
			</Modal>
		</>
	);
}
