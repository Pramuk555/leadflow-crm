import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: member } = await supabase.from('team_members').select('org_id').eq('user_id', user.id).single();
  if (!member) return NextResponse.json({ error: 'No organization' }, { status: 403 });

  const body = await request.json();
  const { prospect_id } = body;
  if (!prospect_id) return NextResponse.json({ error: 'prospect_id required' }, { status: 400 });

  const { data: prospect } = await supabase.from('prospects').select('*').eq('id', prospect_id).eq('org_id', member.org_id).single();
  if (!prospect) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data: org } = await supabase.from('organizations').select('gemini_api_key').eq('id', member.org_id).single();
  const apiKey = org?.gemini_api_key || process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'No API key configured' }, { status: 400 });

  const { data: activities } = await supabase.from('activity_log').select('*').eq('prospect_id', prospect_id).order('created_at', { ascending: true });
  
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-1.5-flash', 
    systemInstruction: 'You are a CRM assistant for a web development agency. Summarize the sales activity and suggest the next best action. Return JSON in this format: { "summary": "...", "next_action": "..." }' 
  });

  const prompt = `Activities for ${prospect.business_name}:\n` + (activities || []).map(a => `[${a.created_at}] ${a.type}: ${a.content}`).join('\n');

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { summary: responseText, next_action: 'Please review manually.' };
    
    await supabase.from('activity_log').insert({
      prospect_id,
      org_id: member.org_id,
      created_by: user.id,
      type: 'ai_summary',
      content: parsed.summary,
      metadata: { next_action: parsed.next_action }
    });

    return NextResponse.json({ data: parsed, success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
