
import { Injectable } from '@angular/core';
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import { ChargingSession } from '../models/charging-session.model';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    // The API key must be provided through environment variables.
    // This is a placeholder and should be configured in a real build environment.
    const apiKey = (window as any).process?.env?.API_KEY ?? '';
    if (!apiKey) {
      console.warn("Gemini API key is not set. Smart features will be disabled.");
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  /**
   * Generates a summary for a given set of charging sessions.
   * @param sessions - An array of completed charging sessions.
   * @returns A promise that resolves to a string containing the AI-generated summary.
   */
  async generateReportSummary(sessions: ChargingSession[]): Promise<string> {
    if (!this.ai) {
      return Promise.resolve("خدمة التحليل الذكي غير متاحة حالياً.");
    }

    const completedSessions = sessions.filter(s => s.status === 'completed');
    if (completedSessions.length === 0) {
      return Promise.resolve("لا توجد جلسات مكتملة لتوليد ملخص.");
    }

    // Aggregate data for the prompt
    const totalRevenue = completedSessions.reduce((acc, s) => acc + (s.amount || 0), 0);
    const totalKwh = completedSessions.reduce((acc, s) => acc + (s.kwh || 0), 0);
    const revenueByPayment = completedSessions.reduce((acc, s) => {
      acc[s.paymentMethod] = (acc[s.paymentMethod] || 0) + (s.amount || 0);
      return acc;
    }, {} as Record<string, number>);

    // Construct a detailed prompt for the Gemini model
    const prompt = `
      بصفتك محلل بيانات خبير في قطاع شحن المركبات الكهربائية، قم بتحليل البيانات التالية وتقديم ملخص تنفيذي باللغة العربية. 
      يجب أن يكون الملخص موجزًا، احترافيًا، ويسلط الضوء على النقاط الرئيسية.

      بيانات التقرير:
      - إجمالي عدد الشحنات المكتملة: ${completedSessions.length}
      - إجمالي الإيرادات: ${totalRevenue.toFixed(2)} دينار
      - إجمالي الطاقة المباعة: ${totalKwh.toFixed(2)} kWh
      - توزيع الإيرادات حسب طريقة الدفع:
        - نقداً: ${revenueByPayment['cash']?.toFixed(2) || 0} دينار
        - بطاقة: ${revenueByPayment['card']?.toFixed(2) || 0} دينار
        - تحويل: ${revenueByPayment['transfer']?.toFixed(2) || 0} دينار

      المطلوب:
      1. فقرة افتتاحية تلخص الأداء العام.
      2. تحليل موجز للإيرادات وتوزيعها.
      3. ملاحظة أو توصية استراتيجية بناءً على هذه الأرقام (مثال: تشجيع الدفع الإلكتروني إذا كان منخفضًا).
    `;

    try {
      const response: GenerateContentResponse = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      return response.text;
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      return 'حدث خطأ أثناء إنشاء الملخص الذكي. يرجى المحاولة مرة أخرى.';
    }
  }
}
