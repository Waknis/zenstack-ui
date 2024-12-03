import { createFileRoute, Outlet } from '@tanstack/react-router';

import { meta, modelNames } from '~client/form/form-config';
import List from '~client/form/lib/list';
import { ListHeader } from '~client/form/lib/list-header';
import { trpc } from '~client/main';
import { CustomRoomCreateSchema } from '~server/schemas';
import { type HouseRoom } from '~zenstack/models';

export const Route = createFileRoute('/rooms')({
	component: RoomsLayout,
});

// Override metadata to hide the aiSummary field
const metadataOverride: typeof meta = JSON.parse(JSON.stringify(meta));
metadataOverride.models.houseRoom.fields.aiSummary.hidden = true;

// In this example, we omit a field for the create form UI
// This shows how to delegate specific fields to custom mutations
function RoomsLayout() {
	const params = Route.useParams() as { id?: string };
	const id = Number(params.id);

	// Custom create mutation that will generate an ai summary on the server side
	const createRoom = trpc.general.createRoom.useMutation();

	return (
		<div className="page">
			{/* List View */}
			<div className="left-list">

				<div className="list-margin">
					{/* Header */}
					<ListHeader title="Rooms" model={modelNames.houseRoom} schemaOverride={CustomRoomCreateSchema} overrideSubmit={createRoom.mutateAsync} metadataOverride={metadataOverride} />
				</div>

				<List<HouseRoom>
					mode="normal"
					model={modelNames.houseRoom}
					route="/rooms/$id"
					itemId={id}
					render={room => (
						<p className="text-sm">{room.name}</p>
					)}
				/>
			</div>

			{/* Detail View */}
			<div className="right-detail">
				{id ? <Outlet /> : <p>Select a room to view details</p>}
			</div>
		</div>
	);
}
