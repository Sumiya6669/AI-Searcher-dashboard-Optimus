import type { Metadata } from 'next';

import { GroupManager } from './GroupManager';
import { UserManager } from './UserManager';
import { Card, PageHeader } from '@/components/ui/Card';
import { ErrorState } from '@/components/ui/States';
import { fetchAccessGroups, fetchAdminUsers, fetchEntityOptions, fetchRecipients } from '@/server/queries/people';

export const metadata: Metadata = { title: 'Люди и группы' };
export const dynamic = 'force-dynamic';

export default async function PeoplePage() {
  const [users, groups, options, recipients] = await Promise.all([
    fetchAdminUsers(),
    fetchAccessGroups(),
    fetchEntityOptions(),
    fetchRecipients(),
  ]);

  return (
    <>
      <PageHeader
        title="Люди и группы"
        subtitle="Кто входит в систему, что видит и что получает в Telegram"
      />

      <div className="space-y-4">
        {users.ok && groups.ok ? (
          <UserManager users={users.data} groups={groups.data} />
        ) : (
          <Card>
            <ErrorState
              message={users.ok ? (groups.ok ? '' : groups.error) : users.error}
              retryHref="/admin/people"
            />
          </Card>
        )}

        {groups.ok && options.ok && users.ok ? (
          <GroupManager
            groups={groups.data}
            options={options.data}
            users={users.data}
            recipients={recipients.ok ? recipients.data : []}
          />
        ) : (
          <Card>
            <ErrorState
              message={groups.ok ? (options.ok ? '' : options.error) : groups.error}
              retryHref="/admin/people"
            />
          </Card>
        )}
      </div>
    </>
  );
}
