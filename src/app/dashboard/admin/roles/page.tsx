'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Shield, Search, Edit, CheckSquare, Square, ChevronDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useTranslations } from 'next-intl';

interface Permission {
  id: number;
  name: string;
  guard_name: string;
  group_name: string;
  created_at: string;
  updated_at: string;
}

interface Role {
  id: number;
  name: string;
  guard_name: string;
  created_at: string;
  updated_at: string;
  permissions: Permission[];
}

export default function AdminRolesPage() {
  const t = useTranslations('dashboard.roles');
  const tRole = useTranslations('auth.roles');
  const tCommon = useTranslations('common');

  const [roles, setRoles] = React.useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = React.useState<Record<string, Permission[]>>({});
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [editRole, setEditRole] = React.useState<Role | null>(null);
  const [selectedPermissions, setSelectedPermissions] = React.useState<string[]>([]);
  const [submitting, setSubmitting] = React.useState(false);

  const fetchRolesAndPermissions = React.useCallback(async () => {
    setLoading(true);
    try {
      const api = (await import('@/lib/api')).default;
      const [rolesRes, permsRes] = await Promise.all([
        api.get('/admin/roles'),
        api.get('/admin/permissions')
      ]);
      setRoles(rolesRes.data?.data ?? []);
      setAllPermissions(permsRes.data?.data ?? {});
    } catch {
      toast.error(tCommon('error'));
    } finally {
      setLoading(false);
    }
  }, [tCommon]);

  React.useEffect(() => {
    fetchRolesAndPermissions();
  }, [fetchRolesAndPermissions]);

  const ROLE_COLORS: Record<string, string> = {
    'city_admin': 'text-purple-600 bg-purple-100 border-purple-200',
    'rescue_operator': 'text-blue-600 bg-blue-100 border-blue-200',
    'ai_operator': 'text-cyan-600 bg-cyan-100 border-cyan-200',
    'rescue_team': 'text-orange-600 bg-orange-100 border-orange-200',
    'citizen': 'text-gray-600 bg-gray-100 border-gray-200',
  };

  const roleLabel = (roleName: string) => {
    const camelCase = roleName.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
    return tRole(camelCase) || roleName;
  };

  const openEdit = (role: Role) => {
    setEditRole(role);
    setSelectedPermissions(role.permissions.map(p => p.name));
  };

  const handleTogglePermission = (permName: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permName) 
        ? prev.filter(p => p !== permName)
        : [...prev, permName]
    );
  };

  const handleSelectGroup = (groupPerms: Permission[], selectAll: boolean) => {
    const names = groupPerms.map(p => p.name);
    if (selectAll) {
      setSelectedPermissions(prev => Array.from(new Set([...prev, ...names])));
    } else {
      setSelectedPermissions(prev => prev.filter(p => !names.includes(p)));
    }
  };

  const handleSaveEdit = async () => {
    if (!editRole) return;
    setSubmitting(true);
    try {
      const api = (await import('@/lib/api')).default;
      await api.put(`/admin/roles/${editRole.id}/permissions`, {
        permissions: selectedPermissions
      });
      toast.success(t('updateSuccess'));
      setEditRole(null);
      fetchRolesAndPermissions();
    } catch {
      toast.error(t('updateError'));
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRoles = roles.filter(r => 
    r.name.toLowerCase().includes(search.toLowerCase()) || 
    roleLabel(r.name).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full overflow-auto p-6 space-y-6 custom-scroll">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            placeholder={tCommon('search')}
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6 space-y-4">
                <div className="h-6 w-32 bg-muted rounded" />
                <div className="h-4 w-48 bg-muted rounded" />
                <div className="h-20 bg-muted rounded" />
              </CardContent>
            </Card>
          ))
        ) : filteredRoles.length > 0 ? (
          filteredRoles.map((role) => {
            const colorClass = ROLE_COLORS[role.name] || 'text-gray-600 bg-gray-100 border-gray-200';
            return (
              <motion.div
                key={role.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Card className={`border-t-4 h-full flex flex-col ${colorClass.split(' ')[2]}`}>
                  <CardContent className="p-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass.replace(/border-.*/, '')}`}>
                          <Shield size={20} />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg leading-tight">{roleLabel(role.name)}</h3>
                          <p className="text-xs text-muted-foreground font-mono">{role.name}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(role)}>
                        <Edit size={16} />
                      </Button>
                    </div>
                    
                    <div className="flex-1">
                      <div className="text-sm text-muted-foreground mb-2">
                        {role.permissions.length} {t('colPermissions')}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {role.permissions.slice(0, 5).map(p => (
                          <Badge variant="secondary" key={p.id} className="text-xs font-normal">
                            {p.name}
                          </Badge>
                        ))}
                        {role.permissions.length > 5 && (
                          <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
                            +{role.permissions.length - 5}
                          </Badge>
                        )}
                        {role.permissions.length === 0 && (
                          <span className="text-sm italic text-muted-foreground">No permissions</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        ) : (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No roles found.
          </div>
        )}
      </div>

      {/* Edit Permissions Dialog */}
      <Dialog open={!!editRole} onOpenChange={(open) => !open && setEditRole(null)}>
        <DialogContent className="max-w-3xl sm:max-w-2xl md:max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{t('editTitle', { role: editRole ? roleLabel(editRole.name) : '' })}</DialogTitle>
            <DialogDescription>
              {t('editDesc')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scroll py-4">
            {Object.entries(allPermissions).map(([groupName, groupPerms]) => {
              const allSelected = groupPerms.every(p => selectedPermissions.includes(p.name));
              const someSelected = groupPerms.some(p => selectedPermissions.includes(p.name));
              
              // @ts-ignore
              const groupLabel = t(`groups.${groupName}`) !== `groups.${groupName}` ? t(`groups.${groupName}`) : groupName;

              return (
                <div key={groupName} className="border rounded-lg overflow-hidden">
                  <div className="bg-muted/50 p-3 flex justify-between items-center border-b">
                    <h4 className="font-semibold capitalize flex items-center gap-2">
                      <ChevronDown size={16} className="text-muted-foreground" />
                      {groupLabel}
                    </h4>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 text-xs gap-1"
                      onClick={() => handleSelectGroup(groupPerms, !allSelected)}
                    >
                      {allSelected ? (
                        <><CheckSquare size={14} className="text-primary" /> {t('deselectAll')}</>
                      ) : (
                        <><Square size={14} /> {t('selectAll')}</>
                      )}
                    </Button>
                  </div>
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {groupPerms.map(perm => {
                      const isSelected = selectedPermissions.includes(perm.name);
                      return (
                        <div 
                          key={perm.id} 
                          className={`flex items-start gap-2 p-2 rounded-md border cursor-pointer transition-colors ${isSelected ? 'border-primary/50 bg-primary/5' : 'hover:bg-muted/50'}`}
                          onClick={() => handleTogglePermission(perm.name)}
                        >
                          <div className="mt-0.5 text-primary shrink-0">
                            {isSelected ? <CheckSquare size={16} /> : <Square size={16} className="text-muted-foreground" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium leading-tight break-words">{perm.name}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <DialogFooter className="pt-4 mt-2 border-t">
            <Button variant="outline" onClick={() => setEditRole(null)}>{tCommon('cancel')}</Button>
            <Button onClick={handleSaveEdit} disabled={submitting}>{tCommon('save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
