'use client'

import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'
import { createClient } from '../../../lib/supabase/client'

type Member = {
  id: string
  full_name: string | null
  email: string | null
  role: string | null
}

type Group = {
  id: string
  name: string
  description: string | null
  group_type: string | null
  leader_id: string | null
  is_active: boolean
  created_at: string
}

type GroupMember = {
  id: string
  group_id: string
  user_id: string
  role_in_group: string
}

type Props = {
  members: Member[]
  groups: Group[]
  groupMembers: GroupMember[]
  currentUserId: string
}

const groupTypes = [
  'general',
  'bible_study',
  'prayer',
  'training',
  'leadership',
  'music',
  'new_members',
  'service_team',
]

const groupRoles = ['leader', 'assistant', 'member', 'trainee']

export default function GroupsManager({
  members,
  groups,
  groupMembers,
  currentUserId,
}: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [groupType, setGroupType] = useState('general')
  const [leaderId, setLeaderId] = useState('')
  const [isActive, setIsActive] = useState(true)

  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [selectedUserId, setSelectedUserId] = useState('')
  const [roleInGroup, setRoleInGroup] = useState('member')

  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  function getMemberName(id: string | null) {
    if (!id) return 'No leader'
    const member = members.find((item) => item.id === id)
    return member?.full_name || member?.email || 'Unknown member'
  }

  function getGroupName(id: string) {
    return groups.find((group) => group.id === id)?.name || 'Unknown group'
  }

  function getMembersForGroup(groupId: string) {
    return groupMembers.filter((item) => item.group_id === groupId)
  }

  async function createGroup(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    if (!name.trim()) {
      setMessage('Enter a group name.')
      setLoading(false)
      return
    }

    const { error } = await supabase.from('citizen_groups').insert({
      name: name.trim(),
      description: description.trim() || null,
      group_type: groupType,
      leader_id: leaderId || null,
      is_active: isActive,
      created_by: currentUserId,
    })

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    setMessage('Group created.')
    setName('')
    setDescription('')
    setGroupType('general')
    setLeaderId('')
    setIsActive(true)
    setLoading(false)
    router.refresh()
  }

  async function addMemberToGroup(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    if (!selectedGroupId || !selectedUserId) {
      setMessage('Select a group and a member.')
      setLoading(false)
      return
    }

    const { error } = await supabase.from('citizen_group_members').insert({
      group_id: selectedGroupId,
      user_id: selectedUserId,
      role_in_group: roleInGroup,
    })

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    setMessage('Member added to group.')
    setSelectedUserId('')
    setRoleInGroup('member')
    setLoading(false)
    router.refresh()
  }

  async function removeMember(membershipId: string) {
    const confirmed = window.confirm('Remove this member from the group?')
    if (!confirmed) return

    const { error } = await supabase
      .from('citizen_group_members')
      .delete()
      .eq('id', membershipId)

    if (error) {
      setMessage(error.message)
      return
    }

    router.refresh()
  }

  async function toggleGroupActive(group: Group) {
    const { error } = await supabase
      .from('citizen_groups')
      .update({
        is_active: !group.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', group.id)

    if (error) {
      setMessage(error.message)
      return
    }

    router.refresh()
  }

  async function deleteGroup(groupId: string) {
    const confirmed = window.confirm('Delete this group and its memberships?')
    if (!confirmed) return

    const { error } = await supabase
      .from('citizen_groups')
      .delete()
      .eq('id', groupId)

    if (error) {
      setMessage(error.message)
      return
    }

    router.refresh()
  }

  return (
    <div className='grid grid-cols-1 gap-8 lg:grid-cols-[420px_1fr]'>
      <div className='space-y-6'>
        <form
          onSubmit={createGroup}
          className='space-y-4 rounded-2xl border border-yellow-900/40 bg-[#120707] p-5'
        >
          <div>
            <p className='text-xs uppercase tracking-[0.25em] text-yellow-500'>
              Create Group
            </p>
            <h2 className='mt-2 text-2xl font-bold'>New Citizen Group</h2>
          </div>

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className='w-full rounded bg-white p-3 text-black'
            placeholder='Group name'
          />

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className='min-h-28 w-full rounded bg-white p-3 text-black'
            placeholder='Group description'
          />

          <select
            value={groupType}
            onChange={(e) => setGroupType(e.target.value)}
            className='w-full rounded bg-white p-3 text-black'
          >
            {groupTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          <select
            value={leaderId}
            onChange={(e) => setLeaderId(e.target.value)}
            className='w-full rounded bg-white p-3 text-black'
          >
            <option value=''>Select leader optional</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.full_name || member.email} — {member.role || 'member'}
              </option>
            ))}
          </select>

          <label className='flex items-center gap-2 text-sm text-gray-300'>
            <input
              type='checkbox'
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            Active group
          </label>

          <button
            disabled={loading}
            className='w-full rounded-full bg-yellow-500 px-5 py-3 font-bold text-black disabled:opacity-50'
          >
            {loading ? 'Saving...' : 'Create Group'}
          </button>
        </form>

        <form
          onSubmit={addMemberToGroup}
          className='space-y-4 rounded-2xl border border-yellow-900/40 bg-[#120707] p-5'
        >
          <div>
            <p className='text-xs uppercase tracking-[0.25em] text-yellow-500'>
              Add Member
            </p>
            <h2 className='mt-2 text-2xl font-bold'>Group Membership</h2>
          </div>

          <select
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            className='w-full rounded bg-white p-3 text-black'
          >
            <option value=''>Select group</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>

          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className='w-full rounded bg-white p-3 text-black'
          >
            <option value=''>Select member</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.full_name || member.email} — {member.role || 'member'}
              </option>
            ))}
          </select>

          <select
            value={roleInGroup}
            onChange={(e) => setRoleInGroup(e.target.value)}
            className='w-full rounded bg-white p-3 text-black'
          >
            {groupRoles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>

          <button
            disabled={loading}
            className='w-full rounded-full bg-yellow-500 px-5 py-3 font-bold text-black disabled:opacity-50'
          >
            {loading ? 'Saving...' : 'Add Member'}
          </button>

          {message && <p className='text-sm text-yellow-300'>{message}</p>}
        </form>
      </div>

      <div className='space-y-5'>
        <h2 className='text-2xl font-bold'>Groups</h2>

        {groups.map((group) => {
          const memberships = getMembersForGroup(group.id)

          return (
            <article
              key={group.id}
              className='rounded-2xl border border-yellow-900/40 bg-[#120707] p-5'
            >
              <div className='flex flex-col gap-4 md:flex-row md:items-start md:justify-between'>
                <div>
                  <p className='text-xs uppercase tracking-[0.25em] text-yellow-500'>
                    {group.group_type || 'general'} · {group.is_active ? 'active' : 'inactive'}
                  </p>

                  <h3 className='mt-2 text-2xl font-bold'>{group.name}</h3>

                  {group.description && (
                    <p className='mt-2 text-sm leading-6 text-gray-300'>
                      {group.description}
                    </p>
                  )}

                  <p className='mt-3 text-sm text-gray-400'>
                    Leader: {getMemberName(group.leader_id)}
                  </p>
                </div>

                <div className='flex flex-wrap gap-2'>
                  <button
                    onClick={() => toggleGroupActive(group)}
                    className='rounded bg-yellow-700 px-3 py-1 text-sm text-white'
                  >
                    {group.is_active ? 'Deactivate' : 'Activate'}
                  </button>

                  <button
                    onClick={() => deleteGroup(group.id)}
                    className='rounded bg-red-700 px-3 py-1 text-sm text-white'
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className='mt-5 rounded-xl border border-yellow-900/30 bg-black/30 p-4'>
                <p className='text-sm font-bold text-yellow-300'>
                  Members
                </p>

                <div className='mt-3 space-y-2'>
                  {memberships.map((membership) => (
                    <div
                      key={membership.id}
                      className='flex flex-col gap-2 rounded-lg border border-gray-800 p-3 text-sm md:flex-row md:items-center md:justify-between'
                    >
                      <div>
                        <p className='font-semibold text-white'>
                          {getMemberName(membership.user_id)}
                        </p>
                        <p className='text-gray-400'>
                          Role: {membership.role_in_group}
                        </p>
                      </div>

                      <button
                        onClick={() => removeMember(membership.id)}
                        className='rounded bg-red-700 px-3 py-1 text-xs text-white'
                      >
                        Remove
                      </button>
                    </div>
                  ))}

                  {memberships.length === 0 && (
                    <p className='text-sm text-gray-500'>
                      No members added yet.
                    </p>
                  )}
                </div>
              </div>
            </article>
          )
        })}

        {groups.length === 0 && (
          <div className='rounded-2xl border border-yellow-900/30 p-6 text-gray-400'>
            No groups have been created yet.
          </div>
        )}
      </div>
    </div>
  )
}