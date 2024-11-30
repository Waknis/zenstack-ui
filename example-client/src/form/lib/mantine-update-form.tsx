import { useNavigate } from '@tanstack/react-router';

import type { RouteFullPaths } from '~client/routes/-sidebar';
import { ZenstackUpdateForm } from '~zenstack-ui/form/form';

type FormProps = React.ComponentProps<typeof ZenstackUpdateForm> & {
	route: RouteFullPaths
};

const MantineZenstackUpdateForm = (props: FormProps) => {
	const navigate = useNavigate();

	const handleIdChanged = (id: number | string) => {
		navigate({ to: props.route, params: { id } });
	};

	return (
		<div className="relative">
			<ZenstackUpdateForm {...props} onIdChanged={handleIdChanged} />
		</div>
	);
};

export default MantineZenstackUpdateForm;
