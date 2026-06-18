const { chromium } = require('./node_modules/playwright');
const BASE = 'http://localhost:5174';
const results = [];
let browser, page;

async function shot(name) {
  try { await page.screenshot({ path: '/tmp/panel_' + name + '.png' }); } catch(_) {}
}

async function step(num, desc, fn) {
  try { await fn(); results.push('OK  ' + num + '. ' + desc); }
  catch(e) {
    results.push('ERR ' + num + '. ' + desc + ' -- ' + e.message.slice(0,120));
    await shot('fail_' + num);
  }
}

(async () => {
  browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();
  page = await ctx.newPage();
  await page.goto(BASE);

  const tokenResp = await page.evaluate(async () => {
    const r = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario: 'admin', password: 'Admin123*' })
    });
    return r.json();
  });
  await page.evaluate((t) => localStorage.setItem('prisma_admin_token', t), tokenResp.token);

  await page.goto(BASE + '/admin', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  await step(1, 'Titulo panel visible', async () => {
    const h1 = await page.textContent('h1');
    if (!h1.includes('administrac')) throw new Error('h1: ' + h1);
    console.log('  h1:', h1.trim());
    await shot('01_panel');
  });

  await step(2, 'Stats cards cargadas', async () => {
    const body = await page.textContent('body');
    if (!body.includes('Total')) throw new Error('No hay stats');
    if (!body.includes('vehículo') && !body.includes('Vigencias')) throw new Error('Stats incompletas');
    await shot('02_stats');
    console.log('  Stats OK');
  });

  await step(3, 'Tabla con 5 vehiculos visibles', async () => {
    const filas = await page.locator('tbody tr').count();
    if (filas < 5) throw new Error('Filas: ' + filas);
    const txt = await page.textContent('tbody');
    if (!txt.includes('ABC123')) throw new Error('No se ve ABC123');
    console.log('  Filas:', filas);
    await shot('03_tabla');
  });

  await step(4, 'Filtro clase MOTOCICLETA da 2 filas', async () => {
    const selects = await page.locator('select').all();
    let found = null;
    for (const s of selects) {
      const opts = await s.locator('option').allTextContents();
      if (opts.includes('MOTOCICLETA')) { found = s; break; }
    }
    if (!found) throw new Error('Select clase no encontrado');
    await found.selectOption('MOTOCICLETA');
    await page.waitForTimeout(800);
    const filas = await page.locator('tbody tr').count();
    console.log('  Filas MOTO:', filas);
    if (filas !== 2) throw new Error('Esperaba 2, hay ' + filas);
    await shot('04_filtro');
  });

  await step(5, 'Boton Limpiar restaura todos', async () => {
    await page.locator('button').filter({ hasText: /limpiar/i }).first().click();
    await page.waitForTimeout(800);
    const filas = await page.locator('tbody tr').count();
    if (filas < 5) throw new Error('Filas: ' + filas);
    console.log('  Filas sin filtro:', filas);
    await shot('05_limpio');
  });

  await step(6, 'Desactivar columna Avaluo la quita del header', async () => {
    const labels = await page.locator('label').all();
    let cb = null;
    for (const l of labels) {
      const t = await l.textContent();
      if (t && t.includes('Avalúo')) { cb = l.locator('input[type=checkbox]'); break; }
    }
    if (!cb) throw new Error('Checkbox Avaluo no encontrado');
    await cb.click();
    await page.waitForTimeout(300);
    const ths = await page.locator('thead th').allTextContents();
    const hayAvaluo = ths.some(h => h.includes('valuo') || h.includes('Aval'));
    if (hayAvaluo) throw new Error('Avaluo sigue: ' + ths.join('|'));
    console.log('  Headers:', ths.filter(h => h.trim()).join(' | '));
    await shot('06_columnas');
  });

  await step(7, 'Clic en fila abre panel de detalle', async () => {
    await page.locator('tbody tr').first().click();
    await page.waitForTimeout(2000);
    const body = await page.textContent('body');
    const tieneDetalle = body.includes('Datos del vehículo') || body.includes('Vigencias (');
    if (!tieneDetalle) throw new Error('Panel sin detalle');
    console.log('  Panel detalle abierto OK');
    await shot('07_detalle');
  });

  await step(8, 'Cerrar panel con clic en overlay', async () => {
    await page.mouse.click(50, 300);
    await page.waitForTimeout(600);
    await shot('08_cerrado');
    console.log('  Panel cerrado');
  });

  await browser.close();
  console.log('\n=== RESULTADOS ===');
  results.forEach(r => console.log(r));
  process.exit(results.filter(r => r.startsWith('ERR')).length ? 1 : 0);
})();
