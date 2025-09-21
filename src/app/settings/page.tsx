'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  User, 
  Bell, 
  Shield, 
  Key, 
  Trash2, 
  Save,
  Eye,
  EyeOff,
  CheckCircle
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { ActivityLogger } from '@/lib/activityLogger'

interface UserSettings {
  name: string
  display_name: string
  username: string
  bio: string
  email_notifications: boolean
  marketing_emails: boolean
  two_factor_enabled: boolean
  api_access_enabled: boolean
}

export default function SettingsPage() {
  const { user, session, updateProfile } = useAuth()
  const [settings, setSettings] = useState<UserSettings>({
    name: '',
    display_name: '',
    username: '',
    bio: '',
    email_notifications: true,
    marketing_emails: false,
    two_factor_enabled: false,
    api_access_enabled: false
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [showApiKey, setShowApiKey] = useState(false)
  const [apiKey, setApiKey] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchUserSettings()
    }
  }, [user])

  const fetchUserSettings = async () => {
    try {
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user?.id)
        .single()

      if (profile) {
        setSettings({
          name: profile.name || '',
          display_name: profile.display_name || '',
          username: profile.username || '',
          bio: profile.bio || '',
          email_notifications: profile.email_notifications ?? true,
          marketing_emails: profile.marketing_emails ?? false,
          two_factor_enabled: profile.two_factor_enabled ?? false,
          api_access_enabled: profile.api_access_enabled ?? false
        })
      }
    } catch (error) {
      console.error('Error fetching user settings:', error)
      setMessage({ type: 'error', text: 'Failed to load settings' })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    if (!user) return

    setSaving(true)
    setMessage(null)

    try {
      const { error } = await updateProfile({
        name: settings.name,
        display_name: settings.display_name,
        username: settings.username,
        bio: settings.bio
      })

      if (error) {
        setMessage({ type: 'error', text: error.message })
      } else {
        // Update additional settings in database
        const { error: dbError } = await supabase
          .from('users')
          .update({
            email_notifications: settings.email_notifications,
            marketing_emails: settings.marketing_emails,
            two_factor_enabled: settings.two_factor_enabled,
            api_access_enabled: settings.api_access_enabled,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id)

        if (dbError) {
          setMessage({ type: 'error', text: 'Failed to save some settings' })
        } else {
          setMessage({ type: 'success', text: 'Settings saved successfully!' })
          
          // Log the activity
          await ActivityLogger.logActivity(
            user.id,
            'settings_updated',
            { settings: Object.keys(settings) }
          )
        }
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      setMessage({ type: 'error', text: 'Failed to save settings' })
    } finally {
      setSaving(false)
    }
  }

  const handleGenerateApiKey = async () => {
    if (!user) return

    setSaving(true)
    try {
      // Generate a new API key
      const keyPrefix = 'vai_'
      const randomBytes = crypto.getRandomValues(new Uint8Array(32))
      const keySuffix = Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('')
      const fullKey = keyPrefix + keySuffix

      // Hash the key for storage
      const encoder = new TextEncoder()
      const data = encoder.encode(fullKey)
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

      // Store in database
      const { error } = await supabase
        .from('api_keys')
        .insert({
          user_id: user.id,
          name: 'Default API Key',
          key_hash: keyHash,
          key_prefix: keyPrefix,
          permissions: { read: true, write: true },
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year
        })

      if (error) {
        setMessage({ type: 'error', text: 'Failed to generate API key' })
      } else {
        setApiKey(fullKey)
        setMessage({ type: 'success', text: 'API key generated successfully!' })
        
        // Log the activity
        await ActivityLogger.logActivity(
          user.id,
          'api_key_generated',
          { key_prefix: keyPrefix }
        )
      }
    } catch (error) {
      console.error('Error generating API key:', error)
      setMessage({ type: 'error', text: 'Failed to generate API key' })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!user) return

    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data.'
    )

    if (!confirmed) return

    setSaving(true)
    try {
      // Log the activity before deletion
      await ActivityLogger.logActivity(
        user.id,
        'account_deletion_requested',
        { timestamp: new Date().toISOString() }
      )

      // Delete user account
      const { error } = await supabase.auth.admin.deleteUser(user.id)

      if (error) {
        setMessage({ type: 'error', text: 'Failed to delete account. Please contact support.' })
      } else {
        // Redirect to home page
        window.location.href = '/'
      }
    } catch (error) {
      console.error('Error deleting account:', error)
      setMessage({ type: 'error', text: 'Failed to delete account. Please contact support.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'oklch(21% 0.034 264.665)' }}>
        <div className="text-white text-xl">Loading settings...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'oklch(21% 0.034 264.665)' }}>
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold">Access Denied</h2>
              <p className="text-muted-foreground">
                Please sign in to access your settings.
              </p>
              <Button asChild>
                <a href="/auth/login">Sign In</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'oklch(21% 0.034 264.665)' }}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
          <p className="text-gray-300">
            Manage your account settings and preferences.
          </p>
        </div>

        {message && (
          <Alert className={`mb-6 ${message.type === 'error' ? 'border-red-500' : 'border-green-500'}`}>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription className={message.type === 'error' ? 'text-red-700' : 'text-green-700'}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white/10 border-white/20">
            <TabsTrigger value="profile" className="text-white data-[state=active]:bg-white/20">
              <User className="mr-2 h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="notifications" className="text-white data-[state=active]:bg-white/20">
              <Bell className="mr-2 h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security" className="text-white data-[state=active]:bg-white/20">
              <Shield className="mr-2 h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="api" className="text-white data-[state=active]:bg-white/20">
              <Key className="mr-2 h-4 w-4" />
              API
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Profile Information</CardTitle>
                <CardDescription className="text-gray-300">
                  Update your personal information and profile details.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-white">Full Name</Label>
                    <Input
                      id="name"
                      value={settings.name}
                      onChange={(e) => setSettings(prev => ({ ...prev, name: e.target.value }))}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="display_name" className="text-white">Display Name</Label>
                    <Input
                      id="display_name"
                      value={settings.display_name}
                      onChange={(e) => setSettings(prev => ({ ...prev, display_name: e.target.value }))}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-white">Username</Label>
                  <Input
                    id="username"
                    value={settings.username}
                    onChange={(e) => setSettings(prev => ({ ...prev, username: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-white">Bio</Label>
                  <textarea
                    id="bio"
                    value={settings.bio}
                    onChange={(e) => setSettings(prev => ({ ...prev, bio: e.target.value }))}
                    className="w-full bg-white/10 border border-white/20 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows={3}
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <Button 
                  onClick={handleSaveSettings} 
                  disabled={saving}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {saving ? (
                    <>
                      <Save className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Notification Preferences</CardTitle>
                <CardDescription className="text-gray-300">
                  Choose how you want to be notified about updates and activities.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-white">Email Notifications</Label>
                    <p className="text-sm text-gray-300">
                      Receive notifications about your account activity
                    </p>
                  </div>
                  <Switch
                    checked={settings.email_notifications}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, email_notifications: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-white">Marketing Emails</Label>
                    <p className="text-sm text-gray-300">
                      Receive updates about new features and promotions
                    </p>
                  </div>
                  <Switch
                    checked={settings.marketing_emails}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, marketing_emails: checked }))}
                  />
                </div>

                <Button 
                  onClick={handleSaveSettings} 
                  disabled={saving}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {saving ? (
                    <>
                      <Save className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Preferences
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Security Settings</CardTitle>
                <CardDescription className="text-gray-300">
                  Manage your account security and authentication preferences.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-white">Two-Factor Authentication</Label>
                    <p className="text-sm text-gray-300">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <Switch
                    checked={settings.two_factor_enabled}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, two_factor_enabled: checked }))}
                  />
                </div>

                <div className="pt-4 border-t border-white/20">
                  <div className="space-y-2">
                    <Label className="text-white text-red-400">Danger Zone</Label>
                    <p className="text-sm text-gray-300">
                      Once you delete your account, there is no going back. Please be certain.
                    </p>
                    <Button 
                      onClick={handleDeleteAccount}
                      disabled={saving}
                      variant="destructive"
                      className="mt-2"
                    >
                      {saving ? (
                        <>
                          <Trash2 className="mr-2 h-4 w-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Account
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api" className="space-y-6">
            <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">API Access</CardTitle>
                <CardDescription className="text-gray-300">
                  Manage your API keys for programmatic access to VaryAI.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-white">Enable API Access</Label>
                    <p className="text-sm text-gray-300">
                      Allow programmatic access to your account
                    </p>
                  </div>
                  <Switch
                    checked={settings.api_access_enabled}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, api_access_enabled: checked }))}
                  />
                </div>

                {settings.api_access_enabled && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-white">API Key</Label>
                      {apiKey ? (
                        <div className="flex items-center space-x-2">
                          <Input
                            value={apiKey}
                            type={showApiKey ? 'text' : 'password'}
                            readOnly
                            className="bg-white/10 border-white/20 text-white font-mono"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowApiKey(!showApiKey)}
                            className="border-white/20 text-white hover:bg-white/10"
                          >
                            {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          onClick={handleGenerateApiKey}
                          disabled={saving}
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          {saving ? (
                            <>
                              <Key className="mr-2 h-4 w-4 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Key className="mr-2 h-4 w-4" />
                              Generate API Key
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                    
                    <div className="text-sm text-gray-300">
                      <p>Keep your API key secure and never share it publicly.</p>
                      <p>Use it in the Authorization header: <code className="bg-white/10 px-1 rounded">Bearer your_api_key</code></p>
                    </div>
                  </div>
                )}

                <Button 
                  onClick={handleSaveSettings} 
                  disabled={saving}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {saving ? (
                    <>
                      <Save className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Settings
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
