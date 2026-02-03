import SpaceDescription from "@/features/space/components/space-description";
import SpaceHomeTabs from "@/features/space/components/space-home-tabs.tsx";
import { useGetSpaceBySlugQuery } from "@/features/space/queries/space-query.ts";
import { getAppName } from "@/lib/config.ts";
import { Container } from "@mantine/core";
import { Helmet } from "react-helmet-async";
import { useParams } from "react-router-dom";

export default function SpaceHome() {
    const {spaceSlug} = useParams();
    const {data: space} = useGetSpaceBySlugQuery(spaceSlug);

    return (
        <>
            <Helmet>
                <title>{space?.name || 'Overview'} - {getAppName()}</title>
            </Helmet>
            <Container size={"800"} pt="xl">
                { space && <SpaceDescription />}
                {space && <SpaceHomeTabs/>}
            </Container>
        </>
    );
}
