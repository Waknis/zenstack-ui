import { createFileRoute, Link, Outlet } from '@tanstack/react-router';

import { meta, modelNames } from '~client/form/form-config';
import { ListHeader } from '~client/form/lib/list-header';
import ListSkeleton from '~client/form/lib/skeleton';
import { trpc } from '~client/main';
import { CustomRoomCreateSchema } from '~server/schemas';
import { type HouseRoom } from '~zenstack/models';
import { ZSList } from '~zenstack-ui/list/list';

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

				<ListHeader title="Rooms" model={modelNames.houseRoom} schemaOverride={CustomRoomCreateSchema} overrideSubmit={createRoom.mutateAsync} metadataOverride={metadataOverride} />

				<ZSList<HouseRoom>
					model={modelNames.houseRoom}
					skeleton={<ListSkeleton />}
					render={room => (
						<Link
							key={room.id}
							to="/rooms/$id"
							params={{ id: room.id.toString() }}
							className="list-item"
							data-selected={room.id === id}
						>
							<p className="text-sm">{room.name}</p>
						</Link>
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
