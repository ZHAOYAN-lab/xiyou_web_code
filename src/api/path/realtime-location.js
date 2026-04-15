import { get } from '@/api/http/axios';

const billReportGet = (params) =>
  get('/ifengniao/cloud/server/xiyou/report/bill', { data: params });

export default {
  billReportGet
};
