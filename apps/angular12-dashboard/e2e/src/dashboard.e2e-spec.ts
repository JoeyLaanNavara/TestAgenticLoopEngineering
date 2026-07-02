import { browser, by, element } from 'protractor';

describe('Dashboard Page', () => {
  beforeEach(async () => {
    await browser.get(browser.baseUrl + 'dashboard');
  });

  it('should show 3 stat cards', async () => {
    const cards = element.all(by.css('.stat-card'));
    expect(await cards.count()).toBe(3);
  });

  it('should show Total Users stat', async () => {
    const text = await element(by.css('body')).getText();
    expect(text).toContain('Total Users');
  });

  it('should show Monthly Revenue stat', async () => {
    const text = await element(by.css('body')).getText();
    expect(text).toContain('Monthly Revenue');
  });

  it('should show activity list', async () => {
    const items = element.all(by.css('.activity-item'));
    expect(await items.count()).toBe(5);
  });

  it('should show Recent Activity heading', async () => {
    const text = await element(by.css('body')).getText();
    expect(text).toContain('Recent Activity');
  });
});
