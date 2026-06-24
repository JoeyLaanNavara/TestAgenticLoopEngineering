import { newE2EPage } from '@stencil/core/testing';

describe('ds-button e2e', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ds-button></ds-button>');
    const element = await page.find('ds-button');
    expect(element).toHaveClass('hydrated');
  });

  it('emits dsClick event on click', async () => {
    const page = await newE2EPage();
    await page.setContent('<ds-button label="Test"></ds-button>');
    const clickEvent = await page.spyOnEvent('dsClick');
    const button = await page.find('ds-button >>> button');
    await button.click();
    expect(clickEvent).toHaveReceivedEvent();
  });

  it('does not emit event when disabled', async () => {
    const page = await newE2EPage();
    await page.setContent('<ds-button disabled></ds-button>');
    const clickEvent = await page.spyOnEvent('dsClick');
    const button = await page.find('ds-button >>> button');
    await button.click();
    expect(clickEvent).not.toHaveReceivedEvent();
  });
});
