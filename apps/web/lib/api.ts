/**
 * API client for Project Loom backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/v1";

export interface GenerateDraftRequest {
  original_subject: string;
  original_body: string;
  recipient_name?: string;
  tone: "professional" | "friendly" | "urgent";
}

export interface GenerateDraftResponse {
  subject: string;
  body: string;
}

export interface CreateFollowUpRequest {
  connection_id?: number;  // Optional - uses user's first active connection if not provided
  original_recipient: string;
  original_subject: string;
  original_body: string;
  original_message_id?: string;
  delay_hours: number;
  tone: "professional" | "friendly" | "urgent";
  max_followups: number;
  stop_on_reply: boolean;
}

export interface FollowUpJobResponse {
  id: number;
  user_id: number;
  connection_id: number;
  original_recipient: string;
  original_subject: string;
  original_body: string;
  delay_hours: number;
  tone: string;
  max_followups: number;
  stop_on_reply: boolean;
  status: string;
  draft_subject: string | null;
  draft_body: string | null;
  scheduled_at: string | null;
  sent_at: string | null;
  reply_received_at: string | null;
  created_at: string;
  updated_at: string | null;
}

// Sequence types
export interface SequenceStep {
  step_number: number;
  subject: string;
  body: string;
  tone: "professional" | "friendly" | "urgent";
  delay_days: number;
}

export interface SequenceStepResponse extends SequenceStep {
  id: number;
  sequence_id: number;
  created_at: string;
  updated_at: string | null;
}

export interface CreateSequenceRequest {
  name: string;
  description?: string;
  stop_on_reply: boolean;
  is_active: boolean;
  steps: SequenceStep[];
}

export interface SequenceResponse {
  id: number;
  user_id: number;
  name: string;
  description: string | null;
  stop_on_reply: boolean;
  is_active: boolean;
  steps: SequenceStepResponse[];
  created_at: string;
  updated_at: string | null;
}

export interface SequenceListItem {
  id: number;
  user_id: number;
  name: string;
  description: string | null;
  stop_on_reply: boolean;
  is_active: boolean;
  step_count: number;
  enrollment_count: number;
  active_enrollment_count: number;
  completed_enrollment_count: number;
  created_at: string;
  updated_at: string | null;
}

export interface StartSequenceRequest {
  recipient_email: string;
  recipient_name?: string;
  connection_id: number;
}

export interface SequenceEnrollmentResponse {
  id: number;
  sequence_id: number;
  user_id: number;
  connection_id: number;
  recipient_email: string;
  recipient_name: string | null;
  status: string;
  current_step: number;
  started_at: string | null;
  completed_at: string | null;
  stopped_at: string | null;
  created_at: string;
  updated_at: string | null;
}

// Reply types
export interface ReplyResponse {
  id: number;
  followup_job_id: number;
  user_id: number;
  from_email: string;
  from_name: string | null;
  subject: string;
  body: string;
  html_body: string | null;
  message_id: string | null;
  in_reply_to: string | null;
  received_at: string;
  created_at: string;
  followup_job?: FollowUpJobResponse;
}

export interface SimulateReplyRequest {
  followup_job_id: number;
  from_email?: string;
  from_name?: string;
  subject?: string;
  body: string;
  html_body?: string;
}

class APIClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const config: RequestInit = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `HTTP error! status: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }

  /**
   * Generate AI-powered follow-up draft
   */
  async generateDraft(
    data: GenerateDraftRequest
  ): Promise<GenerateDraftResponse> {
    return this.request<GenerateDraftResponse>("/ai/generate", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /**
   * Create a new follow-up job
   */
  async createFollowUp(
    data: CreateFollowUpRequest
  ): Promise<FollowUpJobResponse> {
    return this.request<FollowUpJobResponse>("/followups", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /**
   * List all follow-up jobs
   */
  async listFollowUps(params?: {
    status_filter?: string;
    limit?: number;
    offset?: number;
  }): Promise<FollowUpJobResponse[]> {
    const searchParams = new URLSearchParams();
    if (params?.status_filter) searchParams.append("status_filter", params.status_filter);
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.offset) searchParams.append("offset", params.offset.toString());

    const query = searchParams.toString();
    return this.request<FollowUpJobResponse[]>(
      `/followups${query ? `?${query}` : ""}`
    );
  }

  /**
   * Get a specific follow-up job
   */
  async getFollowUp(jobId: number): Promise<FollowUpJobResponse> {
    return this.request<FollowUpJobResponse>(`/followups/${jobId}`);
  }

  /**
   * Cancel a follow-up job
   */
  async cancelFollowUp(jobId: number): Promise<FollowUpJobResponse> {
    return this.request<FollowUpJobResponse>(`/followups/${jobId}/cancel`, {
      method: "POST",
    });
  }

  /**
   * Send a follow-up job immediately (for testing)
   */
  async sendFollowUpNow(jobId: number): Promise<FollowUpJobResponse> {
    return this.request<FollowUpJobResponse>(`/followups/${jobId}/send-now`, {
      method: "POST",
    });
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    status: string;
    timestamp: string;
    version: string;
    database: string;
  }> {
    return this.request("/health");
  }

  // Sequence methods

  /**
   * Create a new sequence
   */
  async createSequence(data: CreateSequenceRequest): Promise<SequenceResponse> {
    return this.request<SequenceResponse>("/sequences", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /**
   * List all sequences
   */
  async listSequences(params?: {
    is_active?: boolean;
    skip?: number;
    limit?: number;
  }): Promise<SequenceListItem[]> {
    const searchParams = new URLSearchParams();
    if (params?.is_active !== undefined) searchParams.append("is_active", params.is_active.toString());
    if (params?.skip) searchParams.append("skip", params.skip.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());

    const query = searchParams.toString();
    return this.request<SequenceListItem[]>(
      `/sequences${query ? `?${query}` : ""}`
    );
  }

  /**
   * Get a specific sequence with all steps
   */
  async getSequence(sequenceId: number): Promise<SequenceResponse> {
    return this.request<SequenceResponse>(`/sequences/${sequenceId}`);
  }

  /**
   * Update a sequence
   */
  async updateSequence(
    sequenceId: number,
    data: Partial<Omit<CreateSequenceRequest, "steps">>
  ): Promise<SequenceResponse> {
    return this.request<SequenceResponse>(`/sequences/${sequenceId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete a sequence
   */
  async deleteSequence(sequenceId: number): Promise<void> {
    return this.request<void>(`/sequences/${sequenceId}`, {
      method: "DELETE",
    });
  }

  /**
   * Start a sequence for a recipient
   */
  async startSequence(
    sequenceId: number,
    data: StartSequenceRequest
  ): Promise<SequenceEnrollmentResponse> {
    return this.request<SequenceEnrollmentResponse>(`/sequences/${sequenceId}/start`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /**
   * List enrollments for a sequence
   */
  async listSequenceEnrollments(
    sequenceId: number,
    params?: {
      status_filter?: string;
      skip?: number;
      limit?: number;
    }
  ): Promise<SequenceEnrollmentResponse[]> {
    const searchParams = new URLSearchParams();
    if (params?.status_filter) searchParams.append("status_filter", params.status_filter);
    if (params?.skip) searchParams.append("skip", params.skip.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());

    const query = searchParams.toString();
    return this.request<SequenceEnrollmentResponse[]>(
      `/sequences/${sequenceId}/enrollments${query ? `?${query}` : ""}`
    );
  }

  /**
   * Stop an enrollment
   */
  async stopEnrollment(
    sequenceId: number,
    enrollmentId: number
  ): Promise<SequenceEnrollmentResponse> {
    return this.request<SequenceEnrollmentResponse>(
      `/sequences/${sequenceId}/enrollments/${enrollmentId}/stop`,
      {
        method: "POST",
      }
    );
  }

  // Analytics methods

  /**
   * Get analytics overview
   */
  async getAnalyticsOverview(dateRange?: number): Promise<{
    total_followups: number;
    sent_followups: number;
    replied_followups: number;
    reply_rate: number;
    avg_response_time_hours: number;
    active_sequences: number;
    active_enrollments: number;
  }> {
    const params = new URLSearchParams();
    if (dateRange) params.append("date_range", dateRange.toString());

    const query = params.toString();
    return this.request(`/analytics/overview${query ? `?${query}` : ""}`);
  }

  /**
   * Get analytics trends
   */
  async getAnalyticsTrends(dateRange?: number): Promise<{
    followups_over_time: Array<{ date: string; count: number }>;
    reply_rates_by_tone: Array<{ tone: string; total: number; replied: number; reply_rate: number }>;
    status_distribution: Array<{ status: string; count: number }>;
    performance_by_day: Array<{ day: string; total: number; replied: number; reply_rate: number }>;
  }> {
    const params = new URLSearchParams();
    if (dateRange) params.append("date_range", dateRange.toString());

    const query = params.toString();
    return this.request(`/analytics/trends${query ? `?${query}` : ""}`);
  }

  /**
   * Get analytics insights
   */
  async getAnalyticsInsights(): Promise<{
    insights: Array<{ type: string; title: string; message: string; icon: string }>;
    best_tone: string | null;
    best_day: string | null;
  }> {
    return this.request("/analytics/insights");
  }

  // Reply methods

  /**
   * List all replies
   */
  async listReplies(params?: {
    limit?: number;
    offset?: number;
    search?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<ReplyResponse[]> {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.offset) searchParams.append("offset", params.offset.toString());
    if (params?.search) searchParams.append("search", params.search);
    if (params?.start_date) searchParams.append("start_date", params.start_date);
    if (params?.end_date) searchParams.append("end_date", params.end_date);

    const query = searchParams.toString();
    return this.request<ReplyResponse[]>(
      `/replies${query ? `?${query}` : ""}`
    );
  }

  /**
   * Get a specific reply
   */
  async getReply(replyId: number): Promise<ReplyResponse> {
    return this.request<ReplyResponse>(`/replies/${replyId}`);
  }

  /**
   * Simulate a reply (for testing)
   */
  async simulateReply(data: SimulateReplyRequest): Promise<ReplyResponse> {
    return this.request<ReplyResponse>("/test/simulate-reply", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
}

// Export singleton instance
export const apiClient = new APIClient();
