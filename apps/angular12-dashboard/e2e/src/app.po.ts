import { browser, by, element } from 'protractor';

export class AppPage {
  async navigateTo(path = '/'): Promise<unknown> {
    return browser.get(browser.baseUrl + path);
  }

  async getPageTitle(): Promise<string> {
    return browser.getTitle();
  }

  async getH1Text(): Promise<string> {
    return element(by.css('h1')).getText();
  }

  async getNavLinks(): Promise<string[]> {
    const links = element.all(by.css('app-navbar a'));
    return links.map(el => el!.getText());
  }
}
