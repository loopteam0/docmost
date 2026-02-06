
import useUserRole from '@/hooks/use-user-role';
import { Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { useGetSpaceBySlugQuery } from '../queries/space-query';
import SpaceDescriptionEditor from './space-description-editor';

export default function SpaceDescription() {
      const { t } = useTranslation();
  const { spaceSlug } = useParams();
  const { data: space } = useGetSpaceBySlugQuery(spaceSlug);  
 const { isAdmin } = useUserRole()


  return (
    <div> 
     <Text size='sm' >{t('Description')}</Text> 
    
      <SpaceDescriptionEditor 
      editable={isAdmin} 
      initialContent={space?.description}
      spaceId={space?.id || ''}
      
      />
     </div>
  )
}
