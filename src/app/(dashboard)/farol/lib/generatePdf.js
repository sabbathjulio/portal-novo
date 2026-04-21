export function gerarRelatorioPdf(process, modalObs) {
  if (!process) return;

  const width = window.screen.width;
  const height = window.screen.height;
  const printWindow = window.open('', '_blank', `width=${width},height=${height},left=0,top=0`);
  
  if (!printWindow) {
    alert("Bloqueador de Pop-ups impediu a impressão. Por favor permita pop-ups para este site.");
    return;
  }

  const blockCheck = '[ &nbsp;&nbsp;&nbsp; ]';
  
  const adm = process.admissao || "___/___/_____";
  const dem = process.demissao || "___/___/_____";
  
  const docsBasicos = [
      'Ficha de Registro / Contrato de Trabalho',
      'ASO (Admissional e Demissional)',
      'Aviso Prévio (Assinado)',
      'TRCT (Termo de Rescisão Assinado)',
      'Extrato FGTS Analítico / Guias Pagas'
  ];

  const docsPermanentes = [
      'Acordos ou Convenções Coletivas Trabalhadas (CCT)',
      'Aditivos, Normas, Regulamento Interno e Frota',
      'Advertências, Suspensões e Histórico Disciplinar',
      'Comprovantes de Benefícios (VA, VR, Cesta)',
      'Termo de Opção ou Recusa de Vale Transporte',
      'PPP (Perfil Profissiográfico Previdenciário / LTCAT)',
      'Relatório Tracker (Latitude, Longitude e Log)'
  ];

  // Adiciona itens extras se for Motorista
  if(String(process.funcao).toLowerCase().includes('motorista')) {
      docsPermanentes.push('Fichas Diárias / Refeições e Pernoites (MOTORISTA)');
  }

  const css = `
    body { font-family: 'Times New Roman', Times, serif; font-size: 11px; margin: 0; padding: 40px; color: #000; }
    @media print { body { padding: 0; } @page { margin: 15mm; } }
    .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 15px; }
    h1 { font-size: 19px; margin: 0; text-transform: uppercase; letter-spacing: 1px; font-weight: 800; }
    h2 { font-size: 11px; margin: 5px 0 0 0; color: #444; font-weight: normal; letter-spacing: 3px; }
    .grid-info { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; border: 1.5px solid #000; padding: 12px; margin-bottom: 20px; }
    .grid-info div { border-bottom: 1px dashed #ccc; padding-bottom: 4px; }
    .section-title { font-size: 12px; background: #eee; padding: 6px; border-left: 4px solid #000; margin-bottom: 8px; font-weight: bold; text-transform: uppercase; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th { border: 1px solid #000; background: #EAEAEA; padding: 6px; text-align: left; }
    td { border: 1px solid #000; padding: 4px 10px; }
    .text-center { text-align: center; }
    .check-cell { width: 60px; text-align: center; font-family: monospace; font-size: 12px; }
    .obs-box { border: 1.5px solid #000; padding: 10px; min-height: 50px; margin-bottom: 40px; font-style: italic; }
    .signatures { display: flex; justify-content: space-between; align-items: flex-end; padding: 0 40px; margin-top: 40px; }
  `;

  // Mapear arrays para HTML
  const rowsBasicos = docsBasicos.map(doc => `
    <tr>
      <td style="font-weight: 700;">${doc}</td>
      <td class="check-cell">${blockCheck}</td>
      <td class="check-cell">${blockCheck}</td>
      <td></td>
    </tr>
  `).join('');

  const rowsPermanentes = docsPermanentes.map(doc => `
    <tr>
      <td style="font-weight: 700;">${doc.toUpperCase()}</td>
      <td class="check-cell">${blockCheck}</td>
      <td class="check-cell">${blockCheck}</td>
      <td></td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Auditoria Farol - ${process.reclamante}</title>
        <style>${css}</style>
      </head>
      <body>
        <div class="header">
          <h1>CHECKLIST DOCUMENTAL – DRE AUDITORIA</h1>
          <h2>LITÍGIO ESTRATÉGICO / ${process.fase || 'CONTENCIOSO'}</h2>
        </div>
        
        <div class="grid-info">
          <div><strong>Reclamante:</strong> ${process.reclamante}</div>
          <div><strong>Processo (CNJ):</strong> ${process.processo}</div>
          <div><strong>Função:</strong> ${process.funcao}</div>
          <div><strong>Unidade:</strong> ${process.unidade}</div>
          <div><strong>Polo Passivo:</strong> ${process.reu || "_____________________________"}</div>
          <div><strong>Admissão:</strong> ${adm}</div>
          <div><strong>Demissão:</strong> ${dem}</div>
        </div>

        <div class="section-title">DOCUMENTAÇÃO ADMISSIONAL E DEMISSIONAL</div>
        <table>
          <thead>
            <tr>
              <th>Documento Base</th>
              <th class="text-center">OK</th>
              <th class="text-center">FALTOU</th>
              <th style="width:150px">Observações</th>
            </tr>
          </thead>
          <tbody>${rowsBasicos}</tbody>
        </table>

        <div class="section-title">KITS PERMANENTES E MÓDULOS DE EXCEÇÃO</div>
        <table>
          <thead>
            <tr>
              <th>Documento Complementar</th>
              <th class="text-center">OK</th>
              <th class="text-center">FALTOU</th>
              <th style="width:150px">Observações</th>
            </tr>
          </thead>
          <tbody>${rowsPermanentes}</tbody>
        </table>

        <div class="section-title">APONTAMENTO JURÍDICO DA TRIAGEM</div>
        <div class="obs-box">
          ${modalObs || "Nenhuma observação cadastrada no Farol eletrônico."}
        </div>

        <div class="signatures">
          <div class="text-center">
            <div style="width: 250px; border-bottom: 1.5px solid #000; margin-bottom: 5px;"></div>
            <span>Assinatura do Analista Responsável</span>
          </div>
          <div>
            Data do Dossiê: ____ / ____ / ________
          </div>
        </div>
        <script>
           window.onload = function() { window.print(); }
           // Tenta fechar The Pop-up se não for o Main window apos a impressão
           // window.onafterprint = function() { window.close(); }
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
