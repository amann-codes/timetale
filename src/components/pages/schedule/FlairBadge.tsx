'use client'
import { getFlair } from '@/lib/actions/getFlair';
import { Flair } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { getContrastTextColor } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';

export function FlairBadge({ id }: { id: string }) {
    const getFlairObject = useQuery({
        queryKey: ['flairId', id],
        queryFn: async (): Promise<Flair> => {
            return await getFlair(id)
        }
    })
    return (
        getFlairObject.data &&
        <Badge
            key={getFlairObject.data.id}
            style={{
                border: `1px solid ${getContrastTextColor(getFlairObject.data.color)}`,
                backgroundColor: getFlairObject.data.color,
                color: getContrastTextColor(getFlairObject.data.color),
            }}
            className="shadow-xs text-sm flex items-center gap-1"
        >
            {getFlairObject.data.name}
        </Badge>
    );
}