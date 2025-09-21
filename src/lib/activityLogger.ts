import { supabase } from './supabase'

export interface ActivityLog {
  id?: string
  user_id: string
  activity_type: string
  activity_data: any
  ip_address?: string
  user_agent?: string
  created_at?: string
}

export class ActivityLogger {
  /**
   * Log user activity
   */
  static async logActivity(
    userId: string,
    activityType: string,
    activityData: any = {},
    metadata?: {
      ipAddress?: string
      userAgent?: string
    }
  ): Promise<void> {
    try {
      const logEntry: ActivityLog = {
        user_id: userId,
        activity_type: activityType,
        activity_data: activityData,
        ip_address: metadata?.ipAddress,
        user_agent: metadata?.userAgent,
      }

      const { error } = await supabase
        .from('activity_logs')
        .insert(logEntry)

      if (error) {
        console.error('Error logging activity:', error)
      }
    } catch (error) {
      console.error('Failed to log activity:', error)
    }
  }

  /**
   * Get user activity logs
   */
  static async getUserActivity(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<ActivityLog[]> {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        console.error('Error fetching user activity:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Failed to fetch user activity:', error)
      return []
    }
  }

  /**
   * Get activity statistics
   */
  static async getActivityStats(userId: string): Promise<{
    totalActivities: number
    activitiesByType: Record<string, number>
    lastActivity?: string
  }> {
    try {
      // Get total count
      const { count: totalActivities } = await supabase
        .from('activity_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      // Get activities by type
      const { data: activitiesByType } = await supabase
        .from('activity_logs')
        .select('activity_type')
        .eq('user_id', userId)

      // Get last activity
      const { data: lastActivity } = await supabase
        .from('activity_logs')
        .select('created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      // Count by type
      const typeCount: Record<string, number> = {}
      activitiesByType?.forEach(activity => {
        typeCount[activity.activity_type] = (typeCount[activity.activity_type] || 0) + 1
      })

      return {
        totalActivities: totalActivities || 0,
        activitiesByType: typeCount,
        lastActivity: lastActivity?.created_at
      }
    } catch (error) {
      console.error('Failed to fetch activity stats:', error)
      return {
        totalActivities: 0,
        activitiesByType: {},
      }
    }
  }

  /**
   * Log generation activity
   */
  static async logGeneration(
    userId: string,
    model: string,
    prompt: string,
    result: any,
    metadata?: {
      ipAddress?: string
      userAgent?: string
    }
  ): Promise<void> {
    await this.logActivity(
      userId,
      'generation',
      {
        model,
        prompt: prompt.substring(0, 100), // Truncate for privacy
        success: !!result,
        result_type: result?.type || 'unknown',
        timestamp: new Date().toISOString()
      },
      metadata
    )
  }

  /**
   * Log authentication activity
   */
  static async logAuth(
    userId: string,
    action: 'login' | 'logout' | 'signup' | 'password_reset',
    metadata?: {
      ipAddress?: string
      userAgent?: string
    }
  ): Promise<void> {
    await this.logActivity(
      userId,
      `auth_${action}`,
      {
        action,
        timestamp: new Date().toISOString()
      },
      metadata
    )
  }

  /**
   * Log subscription activity
   */
  static async logSubscription(
    userId: string,
    action: 'created' | 'updated' | 'cancelled' | 'renewed',
    tier: string,
    metadata?: {
      ipAddress?: string
      userAgent?: string
    }
  ): Promise<void> {
    await this.logActivity(
      userId,
      'subscription',
      {
        action,
        tier,
        timestamp: new Date().toISOString()
      },
      metadata
    )
  }

  /**
   * Log credit activity
   */
  static async logCreditActivity(
    userId: string,
    action: 'purchased' | 'used' | 'refunded',
    amount: number,
    reason?: string,
    metadata?: {
      ipAddress?: string
      userAgent?: string
    }
  ): Promise<void> {
    await this.logActivity(
      userId,
      'credit_activity',
      {
        action,
        amount,
        reason,
        timestamp: new Date().toISOString()
      },
      metadata
    )
  }
}
