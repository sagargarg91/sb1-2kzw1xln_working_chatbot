import { supabase } from './supabase';

// ElevenLabs API configuration
const ELEVENLABS_API_ENDPOINT = 'https://api.elevenlabs.io/v1';
const ELEVENLABS_API_KEY = 'sk_2414a5772c08270cc0cd75cd5ff8f59bc6619d2c5112858a';

interface CallOptions {
  phoneNumber: string;
  campaignId: string;
  language: string;
  accent: string;
  script: string;
  voiceId: string;
  modelId?: string;
  similarityBoost?: number;
  stability?: number;
}

export async function generateVoiceResponse(options: CallOptions) {
  try {
    // Generate voice using ElevenLabs API
    const response = await fetch(`${ELEVENLABS_API_ENDPOINT}/text-to-speech/${options.voiceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY
      },
      body: JSON.stringify({
        text: options.script,
        model_id: options.modelId || 'eleven_multilingual_v2',
        voice_settings: {
          similarity_boost: options.similarityBoost || 0.75,
          stability: options.stability || 0.75
        }
      })
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    // Response is audio data
    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);

    // Create call record in database
    const { error } = await supabase
      .from('call_records')
      .insert({
        campaign_id: options.campaignId,
        start_time: new Date(),
        status: 'in_progress',
        recording_url: audioUrl
      });

    if (error) throw error;

    return audioUrl;
  } catch (error) {
    console.error('Error generating voice response:', error);
    throw error;
  }
}

export async function handleCallStatus(event: any) {
  try {
    const { call_sid, status, recording_url, duration } = event;

    // Update call record
    const { error } = await supabase
      .from('call_records')
      .update({
        status: status,
        recording_url: recording_url,
        duration: duration,
        end_time: status === 'completed' ? new Date() : null
      })
      .eq('call_sid', call_sid);

    if (error) throw error;
  } catch (error) {
    console.error('Error handling call status:', error);
    throw error;
  }
}

export async function generateCallSummary(callId: string) {
  try {
    // Get call details
    const { data: call, error } = await supabase
      .from('call_records')
      .select(`
        *,
        call_targets (
          name,
          phone_number,
          company
        ),
        calling_campaigns (
          name,
          script
        )
      `)
      .eq('id', callId)
      .single();

    if (error) throw error;

    // Generate summary using AI
    const summary = await generateAISummary(call);

    // Update call record with summary
    const { error: updateError } = await supabase
      .from('call_records')
      .update({
        summary: summary.text,
        sentiment: summary.sentiment,
        next_action: summary.nextAction
      })
      .eq('id', callId);

    if (updateError) throw updateError;

    return summary;
  } catch (error) {
    console.error('Error generating call summary:', error);
    throw error;
  }
}

async function generateAISummary(call: any) {
  // Use AI to analyze call transcript and generate summary
  // This is a placeholder - implement actual AI analysis
  return {
    text: "Call summary placeholder",
    sentiment: "neutral",
    nextAction: "follow_up"
  };
}