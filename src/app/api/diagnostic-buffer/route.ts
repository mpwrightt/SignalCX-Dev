import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // Return the diagnostic buffer from global state
    const buffer = global.diagnosticBuffer || [];
    
    return NextResponse.json({
      success: true,
      entries: buffer,
      count: buffer.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[Diagnostic Buffer] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Clear the diagnostic buffer
    global.diagnosticBuffer = [];
    
    return NextResponse.json({
      success: true,
      message: 'Diagnostic buffer cleared',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[Diagnostic Buffer] Error clearing:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}