import { AppPage } from './app.po';
import { browser, logging } from 'protractor';

describe('App', () => {
  let page: AppPage;

  beforeEach(() => {
    page = new AppPage();
  });

  it('should display page title', async () => {
    await page.navigateTo('/');
    const title = await page.getPageTitle();
    expect(title).toBeTruthy();
  });

  it('should redirect to dashboard on root navigation', async () => {
    await page.navigateTo('/');
    const url = await browser.getCurrentUrl();
    expect(url).toContain('/dashboard');
  });

  it('should show Dashboard heading on dashboard page', async () => {
    await page.navigateTo('/dashboard');
    const h1 = await page.getH1Text();
    expect(h1).toBe('Dashboard');
  });

  it('should show Users heading on users page', async () => {
    await page.navigateTo('/users');
    const h1 = await page.getH1Text();
    expect(h1).toBe('Users');
  });

  it('should show Settings heading on settings page', async () => {
    await page.navigateTo('/settings');
    const h1 = await page.getH1Text();
    expect(h1).toBe('Settings');
  });

  afterEach(async () => {
    const logs = await browser.manage().logs().get(logging.Type.BROWSER);
    expect(logs).not.toContain(
      jasmine.objectContaining({ level: logging.Level.SEVERE } as logging.Entry)
    );
  });
});
