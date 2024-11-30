import { Button, Divider, Group, Text, Tooltip, useMantineColorScheme } from '@mantine/core';
import type { FileRoutesByPath } from '@tanstack/react-router';
import { Link } from '@tanstack/react-router';
import { type IconType } from 'react-icons';
import { LuCloud, LuCog, LuExternalLink, LuInfo, LuMoon, LuSun, LuUsers } from 'react-icons/lu';
import { MdOutlineCategory } from 'react-icons/md';
import { TbRoute } from 'react-icons/tb';

import { openTanStackReactQueryDevtools, openTanStackRouterDevtools } from '~client/main';
import { routeTree } from '~client/routeTree.gen';

type RouteKeys = keyof FileRoutesByPath;
export type RouteFullPaths = FileRoutesByPath[RouteKeys]['fullPath'];

interface SidebarItem {
	fullPath: RouteFullPaths
	icon: IconType
}

type RouteGroup = Record<string, SidebarItem[]>;

export const organizedRoutes: RouteGroup = {
	Tables: [
		{ fullPath: '/items', icon: MdOutlineCategory },
		{ fullPath: '/people', icon: LuUsers },
		{ fullPath: '/rooms', icon: LuUsers },
	],
	Info: [
		{ fullPath: '/about', icon: LuInfo },
	],
} as const;

export const sidebarLinks = [
	{
		title: 'GitHub',
		link: 'https://github.com/kirankunigiri/zenstack-ui',
		icon: LuExternalLink,
	},
	{
		title: 'Docs',
		link: 'https://kirankunigiri.notion.site/zenstack-ui-docs-13be451fa71180c7b446ea03eb6e02f6',
		icon: LuExternalLink,
	},
];

const devtoolButtonProps = {
	px: 0,
	size: 'sm' as const,
	color: 'gray' as const,
	variant: 'light' as const,
	styles: { label: { color: 'var(--mantine-color-gray-light-color)' } },
};

export function Sidebar({ children }: { children: React.ReactNode }) {
	const { toggleColorScheme } = useMantineColorScheme();
	const sidebarPadding = 'px-2';
	const { colorScheme } = useMantineColorScheme();
	console.log(colorScheme);

	if (!routeTree.children) return null;

	return (
		<div className="flex h-screen w-screen">

			{/* Sidebar */}
			<div className=" flex w-[200px] min-w-[200px] flex-col gap-2 border-r border-solid border-bd-strong bg-sidebar-bg text-sm">
				{/* Title */}
				<Text className={`ml-1 mt-2 text-lg font-bold ${sidebarPadding}`}>Zenstack UI</Text>

				{/* Divider */}
				<Divider className="border-bd-strong"></Divider>

				{/* Links */}
				<div className={`mt-2 flex flex-col gap-5 ${sidebarPadding}`}>

					{/* Routes */}
					{Object.entries(organizedRoutes).map(([groupTitle, routes]) => (
						<div key={groupTitle} className="flex flex-col gap-1">
							<p className="ml-2 text-xs text-gray-500">
								{groupTitle}
							</p>

							{/* Sidebar Route Links */}
							{routes.map(route => (
								<Link
									key={route.fullPath}
									to={route.fullPath}
									className="flex h-8 w-full items-center gap-[10px] rounded-md bg-transparent pl-3 pr-[18px] text-left font-medium capitalize text-shadcn-darkest hover:bg-[var(--color-hover)] dark:text-shadcn-light [&.active]:bg-shadcn-dark [&.active]:text-shadcn-light [&.active]:dark:bg-btn-secondary"
								>
									<route.icon size={14} />
									<span>{route.fullPath.replaceAll('/', '')}</span>
								</Link>
							))}

							{/* External Links - under the Info group */}
							{groupTitle === 'Info' && (
								sidebarLinks.map(link => (
									<a
										key={link.link}
										href={link.link}
										target="_blank"
										rel="noreferrer"
										className="flex h-8 w-full items-center gap-[10px] rounded-md bg-transparent pl-3 pr-[18px] text-left font-medium capitalize text-shadcn-darkest hover:bg-[var(--color-hover)] dark:text-shadcn-light [&.active]:bg-shadcn-dark [&.active]:text-shadcn-light [&.active]:dark:bg-btn-secondary"
									>
										<link.icon size={14} />
										<span>{link.title}</span>
									</a>
								))
							)}
						</div>
					))}
				</div>

				{/* Spacer */}
				<div className="grow"></div>

				{/* DevTools */}
				<Tooltip.Group>
					<Group grow gap={6} mb={8} className={sidebarPadding}>
						<Tooltip label="TanStack Router">
							<Button {...devtoolButtonProps} onClick={openTanStackRouterDevtools}>
								<TbRoute size={20} />
							</Button>
						</Tooltip>
						<Tooltip label="React Query">
							<Button {...devtoolButtonProps} onClick={openTanStackReactQueryDevtools}>
								<LuCloud size={24} />
							</Button>
						</Tooltip>
						<Tooltip label="Toggle Theme">
							<Button {...devtoolButtonProps} onClick={toggleColorScheme}>
								{colorScheme === 'dark' ? <LuMoon size={22} /> : <LuSun size={22} />}
							</Button>
						</Tooltip>
					</Group>
				</Tooltip.Group>
			</div>

			{/* Outlet Content */}
			<div className="grow">
				{children}
			</div>
		</div>
	);
}

export default Sidebar;
