import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';

import type { RouteFullPaths } from '~client/routes/-sidebar';
import { ZenstackUpdateForm } from '~zenstack-ui/form/form';

type FormProps = Omit<React.ComponentProps<typeof ZenstackUpdateForm>, 'onLoadStateChanged'> & {
	route: RouteFullPaths
};

const MantineZenstackUpdateForm = (props: FormProps) => {
	const [isLoading, setIsLoading] = useState(true);
	const navigate = useNavigate();

	const handleIdChanged = (id: number | string) => {
		console.log('id changed to value', id, 'from', props.id);
		navigate({ to: props.route, params: { id } });
	};

	return (
		<div className="relative">
			{/* <LoadingOverlay visible={isLoading} zIndex={1000} overlayProps={{ radius: 'sm', blur: 2 }} /> */}
			<ZenstackUpdateForm {...props} onLoadStateChanged={setIsLoading} onIdChanged={handleIdChanged} />
		</div>
	);
};

export default MantineZenstackUpdateForm;
