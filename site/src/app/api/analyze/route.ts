export async function POST() {
  return new Response(JSON.stringify({
    success: true,
    analysis: {
      keyPoints: ['Test'],
      readability: { gradeLevel: 'high school', score: 8 },
      beforeAfter: { before: 'test', after: '## Test\n\nImproved' },
      suggestedTags: ['test']
    }
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
