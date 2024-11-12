import { Skeleton } from '@mantine/core';

const ListSkeleton = () => {
	return (
		<>
			{Array.from({ length: 10 }).map((_, i) => (
				<Skeleton key={i} height={42} className="list-item" />
			))}
		</>
	);
};

export default ListSkeleton;
