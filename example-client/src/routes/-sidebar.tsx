import { AppShell, Box, Burger, Button, Divider, Group, Text, Tooltip, useMantineColorScheme } from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import type { FileRoutesByPath } from '@tanstack/react-router';
import { Link } from '@tanstack/react-router';
import { type IconType } from 'react-icons';
import { LuCloud, LuExternalLink, LuInfo, LuMoon, LuSun, LuUsers } from 'react-icons/lu';
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
	size: 'sm',
	color: 'gray',
	variant: 'light',
	styles: { label: { color: 'var(--mantine-color-gray-light-color)' } },
} as const;

const sidebarPadding = 'px-2';
const SIDEBAR_HEADER_HEIGHT = 42;

export function useIsMobile() {
	return useMediaQuery('(max-width: 48em)');
}

export function Sidebar({ children }: { children: React.ReactNode }) {
	const [opened, { toggle }] = useDisclosure();
	const isMobile = useIsMobile();
	const { toggleColorScheme } = useMantineColorScheme();
	const { colorScheme } = useMantineColorScheme();
	if (!routeTree.children) return null;

	return (
		<AppShell
			header={{ height: isMobile ? SIDEBAR_HEADER_HEIGHT : 0 }}
			navbar={{ width: 200, breakpoint: 'sm', collapsed: { mobile: !opened } }}
		>
			<AppShell.Header withBorder={isMobile ? true : false}>
				<Group h="100%" px="md" className="bg-sidebar-bg">
					<Burger opened={opened} onClick={toggle} size="sm" />
					<p className="text-lg font-bold">Zenstack UI</p>
				</Group>
			</AppShell.Header>
			<AppShell.Navbar withBorder={false}>

				{/* Sidebar */}
				<div className="flex grow flex-col gap-2 border-r border-solid border-bd-strong bg-sidebar-bg text-sm">

					{/* Header */}
					<div hidden={isMobile}>
						<Text className={`my-2 ml-1 text-lg font-bold ${sidebarPadding}`}>Zenstack UI</Text>
						<Divider className="border-bd-strong"></Divider>
					</div>

					{/* Links */}
					<div className={`mt-2 flex flex-col gap-5 ${sidebarPadding}`}>

						{/* Routes */}
						{Object.entries(organizedRoutes).map(([groupTitle, routes]) => (
							<div key={groupTitle} className="flex flex-col gap-1">
								<p className="sidebar-group-title ml-2 text-xs text-gray-500">
									{groupTitle}
								</p>

								{/* Sidebar Route Links */}
								{routes.map(route => (
									<Link
										key={route.fullPath}
										to={route.fullPath}
										onClick={() => opened && toggle()}
										className="sidebar-link"
									>
										<route.icon />
										<span>{route.fullPath.replaceAll('/', '')}</span>
									</Link>
								))}

								{/* External Links - under the Info group */}
								{groupTitle === 'Info' && (
									sidebarLinks.map(link => (
										<a
											key={link.link}
											href={link.link}
											onClick={() => opened && toggle()}
											target="_blank"
											rel="noreferrer"
											className="sidebar-link"
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
			</AppShell.Navbar>
			<AppShell.Main>
				<Box className="flex w-full" h={isMobile ? `calc(100dvh - ${SIDEBAR_HEADER_HEIGHT}px)` : '100dvh'}>
					{children}
				</Box>
			</AppShell.Main>
		</AppShell>
	);
}

export default Sidebar;
