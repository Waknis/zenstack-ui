import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/about/')({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="flex max-w-screen-md flex-col gap-4 p-4 px-6">
			<p className="text-2xl font-bold">About</p>
			<p>
				Zenstack UI is a React UI library for automating form generation with Zenstack. It utilizes Zenstack metadata to automatically generate forms and perform required queries and mutations.
			</p>
			<p>
				This is a demo website built with Zenstack UI to demonstrate its features. The pages for each table in the sidebar are generated automatically with Zenstack UI.
			</p>
		</div>
	);
}
