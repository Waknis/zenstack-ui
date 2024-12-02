import { useNavigate } from '@tanstack/react-router';

import type { RouteFullPaths } from '~client/routes/-sidebar';
import { ZSUpdateForm } from '~zenstack-ui/form/form';

// MZS stands for Mantine Zenstack
type MZSUpdateFormProps = React.ComponentProps<typeof ZSUpdateForm> & {
	route: RouteFullPaths
	children?: React.ReactNode
};

const MZSUpdateForm = (props: MZSUpdateFormProps) => {
	const navigate = useNavigate();

	const handleIdChanged = (id: number | string) => {
		navigate({ to: props.route, params: { id } });
	};

	return (
		<ZSUpdateForm {...props} onIdChanged={handleIdChanged} formRef={props.formRef}>
			{props.children}
		</ZSUpdateForm>
	);
};

export default MZSUpdateForm;
