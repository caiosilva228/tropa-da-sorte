import { requireAdminRole } from '@/server/auth';
import { getSupabaseClient } from '@/server/db/supabaseAdapter';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // 1. Validar permissão administrativa
    await requireAdminRole(['OWNER', 'ADMIN', 'OPERATOR']);

    // 2. Extrair o arquivo da requisição
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    // 3. Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Formato inválido. Envie imagens em WebP, JPG ou PNG.' },
        { status: 400 }
      );
    }

    // 4. Validar tamanho máximo (5 MB)
    const MAX_SIZE_BYTES = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'A imagem deve ter no máximo 5MB.' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 5. Tentar upload para o Supabase Storage (Bucket 'banners')
    const sb = getSupabaseClient();
    if (sb) {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const cleanFileName = `banner-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

      const { data, error } = await sb.storage
        .from('banners')
        .upload(cleanFileName, buffer, {
          contentType: file.type,
          upsert: true,
        });

      if (!error && data) {
        const { data: pubData } = sb.storage.from('banners').getPublicUrl(cleanFileName);
        if (pubData?.publicUrl) {
          return NextResponse.json({
            success: true,
            url: pubData.publicUrl,
            fileName: cleanFileName,
            size: file.size,
          });
        }
      } else {
        console.warn('Supabase storage upload error:', error);
      }
    }

    // 6. Fallback seguro: Data URL Base64
    const base64Data = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64Data}`;

    return NextResponse.json({
      success: true,
      url: dataUrl,
      fileName: file.name,
      size: file.size,
      isFallback: true,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Falha ao processar upload da imagem';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
