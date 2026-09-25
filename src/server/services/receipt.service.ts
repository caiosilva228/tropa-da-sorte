import { Database } from '@/server/db';
import { formatCentsToBRL, formatDateTime } from '@/lib/formatters';
import { Receipt } from '@/types';
import { jsPDF } from 'jspdf';

export class ReceiptService {
  static async getReceiptByVerificationCode(code: string): Promise<Receipt | null> {
    const state = await Database.getState();
    return state.receipts.find((r) => r.verificationCode.toUpperCase() === code.toUpperCase()) || null;
  }

  static async getReceiptByOrderId(orderId: string): Promise<Receipt | null> {
    const state = await Database.getState();
    return state.receipts.find((r) => r.orderId === orderId) || null;
  }

  static async generateReceiptPdfBuffer(receipt: Receipt): Promise<Uint8Array> {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a5',
    });

    // Fundo escuro elegante da Tropa da Sorte
    doc.setFillColor(16, 18, 20); // #101214
    doc.rect(0, 0, 148, 210, 'F');

    // Header com faixa verde vibrante #16C784
    doc.setFillColor(22, 199, 132);
    doc.rect(0, 0, 148, 8, 'F');

    // Título Principal da Marca
    doc.setTextColor(255, 201, 40); // #FFC928 (Dourado)
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('TROPA DA SORTE', 74, 25, { align: 'center' });

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('COMPROVANTE OFICIAL DE PARTICIPAÇÃO', 74, 32, { align: 'center' });

    // Linha divisória
    doc.setDrawColor(38, 42, 48); // #262A30
    doc.line(15, 38, 133, 38);

    // Box do Prêmio
    doc.setFillColor(24, 27, 31); // #181B1F
    doc.roundedRect(15, 42, 118, 20, 3, 3, 'F');
    doc.setTextColor(156, 163, 175);
    doc.setFontSize(9);
    doc.text('AÇÃO / SORTEIO:', 20, 50);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(receipt.raffleName, 20, 57);

    // Detalhes do Pedido e Participante
    let y = 72;
    const drawRow = (label: string, value: string) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(156, 163, 175);
      doc.text(label, 20, y);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text(value, 128, y, { align: 'right' });
      y += 8;
    };

    drawRow('PEDIDO:', `#${receipt.orderPublicId}`);
    drawRow('PARTICIPANTE:', receipt.customerName);
    drawRow('TELEFONE:', receipt.customerPhoneMasked);
    drawRow('DATA / HORA:', formatDateTime(receipt.issuedAt));
    drawRow('PAGAMENTO:', receipt.paymentMethod.toUpperCase());
    drawRow('VALOR PAGO:', formatCentsToBRL(receipt.totalAmountInCents));

    // Box dos Números
    y += 4;
    doc.setFillColor(24, 27, 31);
    doc.roundedRect(15, y, 118, 28, 3, 3, 'F');
    doc.setTextColor(22, 199, 132); // Verde neon
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('SEUS NÚMEROS GARANTIDOS:', 20, y + 8);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    const numbersStr = receipt.numbers.join('   ');
    doc.text(numbersStr, 20, y + 18);

    // Status Pago / Confirmado
    y += 36;
    doc.setFillColor(22, 199, 132);
    doc.roundedRect(44, y, 60, 10, 5, 5, 'F');
    doc.setTextColor(16, 18, 20);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('STATUS: PAGO 🔥', 74, y + 6.5, { align: 'center' });

    // Código de Verificação e Rodapé
    y += 20;
    doc.setTextColor(156, 163, 175);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Código de Verificação: ${receipt.verificationCode}`, 74, y, { align: 'center' });
    doc.text(`Verifique a autenticidade em: ${process.env.NEXT_PUBLIC_APP_URL}/verificar/${receipt.verificationCode}`, 74, y + 5, { align: 'center' });
    doc.text('Tropa da Sorte - Todos os direitos reservados.', 74, y + 10, { align: 'center' });

    return new Uint8Array(doc.output('arraybuffer'));
  }
}
