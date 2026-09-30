import { escapeHtml as esc } from './core.js';

export const ZODIAC_ART={
  Овен:'aries',
  Телець:'taurus',
  Близнюки:'gemini',
  Рак:'cancer',
  Лев:'leo',
  Діва:'virgo',
  Терези:'libra',
  Скорпіон:'scorpio',
  Стрілець:'sagittarius',
  Козоріг:'capricorn',
  Водолій:'aquarius',
  Риби:'pisces'
};

export function zodiacArt(sign,extraClass=''){
  const slug=ZODIAC_ART[sign?.[0]];
  return slug
    ? `<span class="zodiac-art zodiac-user-art zodiac-${slug} ${extraClass}" role="img" aria-label="Образ знаку ${esc(sign[0])}"></span>`
    : '';
}

export function sunSign(date){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date||''))return null;
  const [,m,d]=date.split('-').map(Number),md=m*100+d;
  if(md>=1222||md<=119)return['Козоріг','♑'];

  const signs=[
    ['Водолій','♒',120,218],
    ['Риби','♓',219,320],
    ['Овен','♈',321,419],
    ['Телець','♉',420,520],
    ['Близнюки','♊',521,620],
    ['Рак','♋',621,722],
    ['Лев','♌',723,822],
    ['Діва','♍',823,922],
    ['Терези','♎',923,1022],
    ['Скорпіон','♏',1023,1121],
    ['Стрілець','♐',1122,1221]
  ];

  return signs.find(([, ,from,to])=>md>=from&&md<=to)?.slice(0,2)||null;
}

export function signElement(sign){
  return ({
    Овен:'Вогонь',
    Лев:'Вогонь',
    Стрілець:'Вогонь',
    Телець:'Земля',
    Діва:'Земля',
    Козоріг:'Земля',
    Близнюки:'Повітря',
    Терези:'Повітря',
    Водолій:'Повітря',
    Рак:'Вода',
    Скорпіон:'Вода',
    Риби:'Вода'
  })[sign]||'—';
}

export function compatibilityText(a,b){
  const ea=signElement(a),eb=signElement(b);

  if(ea===eb){
    return{
      score:86,
      title:'Схожий ритм',
      text:'Багато спільного у способі реагувати й будувати контакт.'
    };
  }

  if([
    ['Вогонь','Повітря'],
    ['Повітря','Вогонь'],
    ['Земля','Вода'],
    ['Вода','Земля']
  ].some(([x,y])=>x===ea&&y===eb)){
    return{
      score:78,
      title:'Взаємне підсилення',
      text:'Стихії традиційно доповнюють одна одну.'
    };
  }

  return{
    score:64,
    title:'Баланс через відмінності',
    text:'Реальна комунікація важливіша за самі знаки.'
  };
}
