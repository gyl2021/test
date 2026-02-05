import { AppConfig, ChatRequestPayload, Citation } from '../types';

export const streamDifyMessage = async (
  query: string,
  config: AppConfig,
  conversationId: string | undefined,
  userId: string,
  onData: (textChunk: string, messageId: string, conversationId: string) => void,
  onCitation: (citations: Citation[]) => void,
  onComplete: () => void,
  onError: (err: string) => void
) => {
  try {
    const response = await fetch(`${config.baseUrl}/v1/chat-messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        inputs: {},
        query: query,
        response_mode: 'streaming',
        conversation_id: conversationId,
        user: userId,
      } as ChatRequestPayload),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    if (!response.body) throw new Error('No response body');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      
      // Process all complete lines
      buffer = lines.pop() || ''; 

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const jsonStr = line.slice(6);
          if (jsonStr === '[DONE]') continue;

          try {
            const data = JSON.parse(jsonStr);
            
            // Handle different event types from Dify
            if (data.event === 'message' || data.event === 'agent_message') {
              if (data.answer) {
                onData(data.answer, data.message_id, data.conversation_id);
              }
            } else if (data.event === 'message_end') {
              // Extract metadata/citations
              if (data.metadata && data.metadata.retriever_resources) {
                onCitation(data.metadata.retriever_resources);
              }
            } else if (data.event === 'error') {
              onError(data.message || 'Unknown error from Dify');
            }
          } catch (e) {
            console.error('Error parsing JSON stream', e);
          }
        }
      }
    }
    
    onComplete();

  } catch (error: any) {
    onError(error.message || 'Network error');
    onComplete();
  }
};