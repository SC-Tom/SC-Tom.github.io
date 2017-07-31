import cleanUpEmail from './utils/cleanUpEmailTemplate';
import createIframe from './utils/createIFrame';
import duplicateBasketItemRow from './utils/duplicateBasketItemRow';
import getNumberOfItemsInBasket from './utils/getNumberOfItemsInBasket';
import itemTagBagMapping from './utils/itemTagBagMapping';
import run from './utils/run';
import sessionTagBagMapping from './utils/sessionTagBagMapping';
import validateInputs from './utils/validateInputs';

const mappingJSON = require('./utils/impressionToPlaceholdersMapping.json');

const generateJSONButton = document.querySelector('#generateJSON');

const generateEmailTemplateFromImpression = () => {
  const alertWarning = document.querySelector('#alert');
  const impressionText = document.querySelector('#impressionJSON').value;
  let emailText = document.querySelector('#emailHTML').value;

  // Validate the inputs.
  validateInputs(emailText, impressionText, alertWarning);

  let impressionJSON;
  let newEmailText;

  // Parse user inputted impressionText into impressionJSON.
  if (impressionText) {
    impressionJSON = JSON.parse(impressionText);
  }

  // Get Number of Basket Items.
  const numberOfBasketItems = getNumberOfItemsInBasket(impressionJSON);

  // Duplicates the Item Row HTML x the amount of basket items. (Replicates the product repeater.)
  // Also injects comments so we can then split each basket row out to inject the placeholders.
  emailText = duplicateBasketItemRow(emailText, numberOfBasketItems);

  // Loops through basket items and inject placeholders.
  if (impressionJSON.basket && Array.isArray(impressionJSON.basket.items)) {
    const basketItems = impressionJSON.basket.items;


    basketItems.forEach((item, ix) => {
      if (mappingJSON && mappingJSON.basket && mappingJSON.basket.items) {
        const mappedItem = mappingJSON.basket.items;
        // we dont really care about instock for the emails and it kinda broke with true being a boolean :rolling_eyes:
        item.product.inStock = undefined;
        // If the first item we do it a tiny bit different.
        if (ix === 0) {
          // We need the html from between [[productlist:start]] and <!--begin
          let firstItemRowHtml = emailText.substring(emailText.lastIndexOf('[[productlist:start]]') + 21, emailText.lastIndexOf('<!-- begin'));
          // Replace old html (with placeholders) with new html that no longer has placeholders.
          firstItemRowHtml = run(firstItemRowHtml, mappedItem, item);
          // Loop through the tagBag for this item and replace the placeholders.
          firstItemRowHtml = itemTagBagMapping(item, firstItemRowHtml);
          // Replace Boilerplate HTML with brand spanking new HTML
          newEmailText = emailText.replace(emailText.substring(emailText.lastIndexOf('[[productlist:start]]') + 21, emailText.lastIndexOf('<!-- begin')), firstItemRowHtml);
        } else {
          // We need the html from between begin-${ix}-item and end-${ix}-item
          let newItemRowHtml = emailText.substring(emailText.lastIndexOf(`begin-${ix}-item`) + 6, emailText.lastIndexOf(`end-${ix}-item`));
          // Replace old html (with placeholders) with new html that no longer has placeholders.
          newItemRowHtml = run(newItemRowHtml, mappedItem, item);
          // Loop through the tagBag for this item and replace the placeholders.
          newItemRowHtml = itemTagBagMapping(item, newItemRowHtml);
          // Replace Boilerplate HTML with brand spanking new HTML
          newEmailText = newEmailText.replace(newEmailText.substring(newEmailText.lastIndexOf(`begin-${ix}-item`) + 6, newEmailText.lastIndexOf(`end-${ix}-item`)), newItemRowHtml);
        }
      }
    });

    // Loop through session TagBag Items.
    newEmailText = sessionTagBagMapping(impressionJSON, emailText, newEmailText);

    // Total Value -- TOOD: refactor.
    if (emailText.toLowerCase().includes('[[totalvalue]]') && impressionJSON.basket.costs.subtotal) {
      newEmailText = newEmailText.split('[[totalvalue]]').join(impressionJSON.basket.costs.subtotal);
    }
    if (emailText.includes('[[TotalValue]]') && impressionJSON.basket.costs.subtotal) {
      newEmailText = newEmailText.split('[[TotalValue]]').join(impressionJSON.basket.costs.subtotal);
    }
    if (emailText.includes('[[TotalValueAndCurrency]]') && impressionJSON.basket.costs.subtotal) {
      newEmailText = newEmailText.split('[[TotalValueAndCurrency]]').join(impressionJSON.basket.costs.subtotal);
    }
    if (emailText.includes('[[session:ym]]') && impressionJSON.basket.shipping && impressionJSON.basket.shipping.cost) {
      newEmailText = newEmailText.split('[[session:ym]]').join(impressionJSON.basket.shipping.cost);
    }
    if (emailText.includes('[[session:dabt]]') && impressionJSON.basket.costs.total) {
      newEmailText = newEmailText.split('[[session:dabt]]').join(impressionJSON.basket.costs.total);
    }

    // Removes items we can't replicate (recommended items & the product repeater.)
    newEmailText = cleanUpEmail(newEmailText);

    // Creates the  iFrame where we display the placeholder injected email template.
    createIframe(newEmailText);
  }
};

generateJSONButton.addEventListener('click', () => {
  generateEmailTemplateFromImpression();
}, false);
