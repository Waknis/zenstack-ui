import { useNavigate } from '@tanstack/react-router';

import type { RouteFullPaths } from '~client/routes/-sidebar';
import { ZenstackUpdateForm } from '~zenstack-ui/form/form';

type MantineZenstackUpdateFormProps = React.ComponentProps<typeof ZenstackUpdateForm> & {
	route: RouteFullPaths
	children?: React.ReactNode
};

const MantineZenstackUpdateForm = (props: MantineZenstackUpdateFormProps) => {
	const navigate = useNavigate();

	const handleIdChanged = (id: number | string) => {
		navigate({ to: props.route, params: { id } });
	};

	return (
		<ZenstackUpdateForm {...props} onIdChanged={handleIdChanged} formRef={props.formRef}>
			{props.children}
		</ZenstackUpdateForm>
	);
};

export default MantineZenstackUpdateForm;
