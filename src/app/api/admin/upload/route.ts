import { requireAdminRole } from '@/server/auth';
import { createClient } from '@supabase/supabase-js';
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

    // 5. Obter cliente Supabase com credenciais completas
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const serviceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY;

    if (supabaseUrl && serviceKey) {
      const sb = createClient(supabaseUrl, serviceKey, {
        auth: { persistSession: false },
      });

      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const cleanFileName = `banner-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

      const { data, error } = await sb.storage
        .from('banners')
        .upload(cleanFileName, buffer, {
          contentType: file.type,
          upsert: true,
        });

      if (error) {
        console.error('Supabase storage upload error:', error);
        return NextResponse.json(
          { error: `Falha ao salvar no servidor de mídia: ${error.message}` },
          { status: 500 }
        );
      }

      if (data) {
        const { data: pubData } = sb.storage.from('banners').getPublicUrl(cleanFileName);
        if (pubData?.publicUrl) {
          return NextResponse.json({
            success: true,
            url: pubData.publicUrl,
            fileName: cleanFileName,
            size: file.size,
          });
        }
      }
    }

    // Fallback: se Supabase Storage não estiver configurado e imagem for pequena (< 100KB)
    if (file.size < 100 * 1024) {
      const base64Data = buffer.toString('base64');
      const dataUrl = `data:${file.type};base64,${base64Data}`;
      return NextResponse.json({
        success: true,
        url: dataUrl,
        fileName: file.name,
        size: file.size,
        isFallback: true,
      });
    }

    return NextResponse.json(
      { error: 'Servidor de armazenamento de imagens não disponível no momento.' },
      { status: 500 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Falha ao processar upload da imagem';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
