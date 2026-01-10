export const servicer = 'kubernetes';
export const webdriver = true;
export const services = ['db', ['nginx', { env: { CA_TEST: 'value' } }]];
export const folders = ['pages'];
