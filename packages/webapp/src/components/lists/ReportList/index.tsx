/*!
 * Copyright (c) Microsoft. All rights reserved.
 * Licensed under the MIT license. See LICENSE file in the project.
 */
import { memo, useState, useEffect, useCallback } from 'react'
import styles from './index.module.scss'
import type ComponentProps from '~types/ComponentProps'
import {
	Contact,
	ContactStatus,
	Service,
	ServiceAnswers,
	ServiceCustomField,
	ServiceStatus
} from '@cbosuite/schema/dist/client-types'
import ClientOnly from '~components/ui/ClientOnly'
import PaginatedList, { FilterOptions, IPaginatedListColumn } from '~components/ui/PaginatedTable'
import cx from 'classnames'
import { OptionType } from '~ui/ReactSelect'
import { IDropdownOption } from '@fluentui/react'
import { wrap } from '~utils/appinsights'
import { Parser } from 'json2csv'
import { useTranslation } from '~hooks/useTranslation'
import MultiActionButton, { IMultiActionButtons } from '~components/ui/MultiActionButton2'
import CLIENT_DEMOGRAPHICS from '~utils/consts/CLIENT_DEMOGRAPHICS'
import { useCurrentUser } from '~hooks/api/useCurrentUser'
import { useServiceList } from '~hooks/api/useServiceList'
import { useContacts } from '~hooks/api/useContacts'
import { useLocale } from '~hooks/useLocale'
import DeleteServiceRecordModal from '~components/ui/DeleteServiceRecordModal'
import CustomDateRangeFilter from '~components/ui/CustomDateRangeFilter'
import CustomTextFieldFilter from '~components/ui/CustomTextFieldFilter'
import CustomNumberRangeFilter from '~components/ui/CustomNumberRangeFilter'
import CustomOptionsFilter from '~components/ui/CustomOptionsFilter'
import ShortString from '~ui/ShortString'
import Panel from '~components/ui/Panel'
import { useBoolean } from '@fluentui/react-hooks'
import FormGenerator from '~components/ui/FormGenerator'

interface ReportListProps extends ComponentProps {
	title?: string
}

interface IFieldFilter {
	id: string
	name: string
	fieldType: string
	value: string[]
}

enum ReportTypes {
	SERVICES = 'services',
	CLIENTS = 'clients'
}

const ReportList = memo(function ReportList({ title }: ReportListProps): JSX.Element {
	const { t } = useTranslation(['reporting', 'clients', 'services'])
	const [locale] = useLocale()
	const { orgId } = useCurrentUser()
	const { serviceList, loading, deleteServiceAnswer, updateServiceAnswer } = useServiceList(orgId)
	const { contacts } = useContacts()
	const [recordToDelete, setRecordToDelete] = useState<
		{ record: ServiceAnswers; serviceId: string } | undefined
	>()
	const [recordToEdit, setRecordToEdit] = useState<
		{ service: Service; record: ServiceAnswers } | undefined
	>()
	const [showModal, setShowModal] = useState(false)
	const [isEditRecordOpen, { setTrue: openEditRecordPanel, setFalse: dismissEditRecordPanel }] =
		useBoolean(false)

	// paginated list state
	const [reportType, setReportType] = useState<ReportTypes | null>(null)
	const [isInitialLoad, setIsInitialLoad] = useState(true)
	const [unfilteredList, setUnfilteredList] = useState<ServiceAnswers[] | Contact[]>([])
	const [filteredList, setFilteredList] = useState<ServiceAnswers[] | Contact[]>([])
	const [pageColumns, setPageColumns] = useState<IPaginatedListColumn[]>([])
	const [reportFilterOption, setReportFilterOption] = useState<FilterOptions | undefined>(undefined)
	const [reportHeaderFilters, setReportHeaderFilters] = useState<IFieldFilter[]>([])
	const [filters, setFilters] = useState<IFieldFilter[]>([])
	const [csvFields, setCsvFields] = useState<{ label: string; value: (item: any) => string }[]>([])
	const [activeServices, setActiveServices] = useState<Service[]>(
		serviceList.filter((service) => service.serviceStatus !== ServiceStatus.Archive)
	)
	const [activeClients, setActiveClients] = useState<Contact[]>(
		contacts.filter((contact) => contact.status !== ContactStatus.Archived)
	)

	// #region Report filter functions
	const filterServiceHelper = useCallback(
		(
			serviceAnswers: ServiceAnswers[],
			filterId: string,
			filterValue: string | string[] | number | number[],
			fieldType?: string
		): ServiceAnswers[] => {
			let tempList = []
			if (filterId === 'name') {
				const searchStr = filterValue[0]
				if (searchStr === '') {
					return serviceAnswers
				}

				tempList = serviceAnswers.filter((item) => {
					const fullName = `${item.contacts[0].name.first} ${item.contacts[0].name.last}`
					return fullName.toLowerCase().includes(searchStr.toLowerCase())
				})
			} else if ((['gender', 'race', 'ethnicity'] as string[]).includes(filterId)) {
				tempList = serviceAnswers.filter((answer) =>
					(filterValue as string[]).includes(answer.contacts[0].demographics[filterId])
				)
			} else {
				if (fieldType === 'date') {
					const [_from, _to] = filterValue as string[]
					const from = _from ? new Date(_from) : undefined
					const to = _to ? new Date(_to) : undefined

					if (!from && !to) {
						return serviceAnswers
					}

					serviceAnswers.forEach((answer) => {
						answer.fieldAnswers[fieldType]?.forEach((fieldAnswer) => {
							if (fieldAnswer.fieldId === filterId) {
								const answerDate = new Date(fieldAnswer.values)
								answerDate.setHours(0, 0, 0, 0)

								if (from && to && answerDate >= from && answerDate <= to) {
									tempList.push(answer)
								}

								if (!from && answerDate <= to) {
									tempList.push(answer)
								}

								if (from && !to && answerDate >= from) {
									tempList.push(answer)
								}
							}
						})
					})
				} else if (fieldType === 'number') {
					const [_lower, _upper] = filterValue as number[]

					serviceAnswers.forEach((answer) => {
						answer.fieldAnswers[fieldType]?.forEach((fieldAnswer) => {
							if (fieldAnswer.fieldId === filterId) {
								const answerNumber = Number(fieldAnswer.values)
								if (_lower && _upper && answerNumber >= _lower && answerNumber <= _upper) {
									tempList.push(answer)
								}
							}
						})
					})
				} else if (['singleText', 'multilineText'].includes(fieldType)) {
					const searchStr = filterValue[0]
					if (searchStr === '') {
						return serviceAnswers
					}

					serviceAnswers.forEach((answer) => {
						answer.fieldAnswers[fieldType]?.forEach((fieldAnswer) => {
							if (fieldAnswer.fieldId === filterId) {
								const answerStr = fieldAnswer?.values || ' '
								if (answerStr.toLowerCase().includes(searchStr.toLowerCase())) {
									tempList.push(answer)
								}
							}
						})
					})
				} else {
					const filterValues = filterValue as string[]

					serviceAnswers.forEach((answer) => {
						answer.fieldAnswers[fieldType]?.forEach((fieldAnswer) => {
							if (fieldAnswer.fieldId === filterId) {
								if (Array.isArray(fieldAnswer.values)) {
									if (filterValues.length === 0) {
										tempList.push(answer)
									}
									if (fieldAnswer.values.some((value) => filterValues.includes(value))) {
										tempList.push(answer)
									}
								} else {
									if (filterValues.includes(fieldAnswer.values)) {
										tempList.push(answer)
									}
								}
							}
						})
					})
				}
			}
			return tempList
		},
		[]
	)
	const filterClientHelper = useCallback(
		(filteredContacts: Contact[], filterId: string, filterValue: string | string[]): Contact[] => {
			let tempList = []
			if (filterId === 'dateOfBirth') {
				tempList = filteredContacts.filter((contact) => {
					const [_from, _to] = filterValue as string[]
					const from = _from ? new Date(_from) : undefined
					const to = _to ? new Date(_to) : undefined
					const birthdate = new Date(contact.dateOfBirth)
					birthdate.setHours(0, 0, 0, 0)

					return (!from && !to) ||
						(from && to && birthdate >= from && birthdate <= to) ||
						(!from && birthdate <= to) ||
						(from && !to && birthdate >= from)
						? true
						: false
				})
			} else if (filterId === 'name') {
				const searchStr = filterValue[0]
				if (searchStr === '') {
					return filteredContacts
				}

				tempList = filteredContacts.filter((contact) => {
					const fullName = `${contact.name.first} ${contact.name.last}`
					return fullName.toLowerCase().includes(searchStr.toLowerCase())
				})
			} else if ((['city', 'county', 'state', 'zip'] as string[]).includes(filterId)) {
				const searchStr = filterValue[0]
				if (searchStr === '') {
					return filteredContacts
				}

				tempList = filteredContacts.filter((contact) => {
					const contactProp = contact?.address?.[filterId] || ' '
					return contactProp?.toLowerCase().includes(searchStr.toLowerCase())
				})
			} else {
				tempList = filteredContacts.filter((contact) =>
					filterValue.includes(contact.demographics[filterId])
				)
			}
			return tempList
		},
		[]
	)
	const filterColumns = useCallback(
		(columnId: string, option: IDropdownOption) => {
			const fieldIndex = filters.findIndex((f) => f.id === columnId)
			if (option.selected) {
				const newFilters = [...filters]
				if (!newFilters[fieldIndex]?.value.includes(option.key as string)) {
					newFilters[fieldIndex]?.value.push(option.key as string)
				}
				setReportHeaderFilters(newFilters)
			} else {
				const newFilters = [...filters]
				const optionIndex = newFilters[fieldIndex]?.value.indexOf(option.key as string)
				if (optionIndex > -1) {
					newFilters[fieldIndex]?.value.splice(optionIndex, 1)
				}
				setReportHeaderFilters(newFilters)
			}
		},
		[filters]
	)
	const filterRangedValues = useCallback(
		(key: string, value: string[]) => {
			const newFilters = [...filters]
			newFilters[filters.findIndex((f) => f.id === key)].value = value
			setReportHeaderFilters(newFilters)
		},
		[filters]
	)
	const filterColumnTextValue = useCallback(
		(key: string, value: string) => {
			filterRangedValues(key, [value])
		},
		[filterRangedValues]
	)
	const getDemographicValue = useCallback(
		(demographicKey: string, contact: Contact): string => {
			switch (contact?.demographics?.[demographicKey]) {
				case '':
				case 'unknown':
					return ''
				case 'other':
					const otherKey = `${demographicKey}Other`
					return contact?.demographics?.[otherKey]
				default:
					return t(
						`demographics.${demographicKey}.options.${contact?.demographics?.[demographicKey]}`
					)
			}
		},
		[t]
	)
	// const resetFilters = useCallback(() => {
	// 	const resetValues = filters.map((f) => ({
	// 		...f,
	// 		value: []
	// 	}))
	// 	setReportHeaderFilters(resetValues)
	// }, [filters])

	useEffect(() => {
		if (!reportHeaderFilters.some(({ value }) => value.length > 0)) {
			setFilteredList(unfilteredList)
		} else {
			let _filteredAnswers = unfilteredList
			reportHeaderFilters.forEach((filter) => {
				if (filter.value.length > 0) {
					if (reportType === ReportTypes.SERVICES) {
						_filteredAnswers = filterServiceHelper(
							_filteredAnswers as ServiceAnswers[],
							filter.id,
							filter.value,
							filter.fieldType
						)
					}
					if (reportType === ReportTypes.CLIENTS) {
						_filteredAnswers = filterClientHelper(
							_filteredAnswers as Contact[],
							filter.id,
							filter.value
						)
					}
				}
				setFilteredList(_filteredAnswers)
			})
		}
	}, [reportHeaderFilters, filterClientHelper, filterServiceHelper, reportType, unfilteredList])
	// #endregion Report filter functions

	// #region Service Report functions
	async function handleUpdateServiceAnswer(values) {
		const res = await updateServiceAnswer({ ...values, answerId: recordToEdit.record.id })

		if (res) {
			const selectedService = activeServices.find((s) => s.id === recordToEdit.service.id)
			setUnfilteredList(selectedService.answers)
			const currentAnswers = [...filteredList] as ServiceAnswers[]
			const newAnswers = currentAnswers.map((a) => {
				if (a.id === recordToEdit.record.id) {
					return { ...a, fieldAnswers: values.fieldAnswers }
				}
				return a
			})
			setFilteredList(newAnswers)

			dismissEditRecordPanel()
		}
	}

	const handleDeleteServiceAnswerAction = (serviceAnswer: ServiceAnswers, serviceId: string) => {
		// Save the record to delete and open the confirmation modal
		setRecordToDelete({ record: serviceAnswer, serviceId })
		setShowModal(true)
	}

	const handleConfirmDelete = useCallback(async () => {
		// delete the record from the drilled down list
		const currentAnswers = [...filteredList] as ServiceAnswers[]
		const newAnswers = currentAnswers.filter((answer) => answer.id !== recordToDelete.record.id)
		setFilteredList(newAnswers)

		const res = await deleteServiceAnswer({
			serviceId: recordToDelete.serviceId,
			answerId: recordToDelete.record.id
		})

		if (res) {
			// delete the record from the unfiltered list
			const selectedService = activeServices.find((s) => s.id === recordToDelete.serviceId)
			setUnfilteredList(selectedService.answers.filter((a) => a.id !== recordToDelete.record.id))
		}

		// Hide modal
		setShowModal(false)
	}, [deleteServiceAnswer, filteredList, activeServices, recordToDelete])

	const buildServiceFilters = useCallback((service: Service): IFieldFilter[] => {
		// build header filters
		const headerFilters: IFieldFilter[] = []
		service.customFields.forEach((field) => {
			headerFilters.push({
				id: field.fieldId,
				name: field.fieldName,
				fieldType: field.fieldType,
				value: []
			})
		})

		if (service.contactFormEnabled) {
			const serviceClientFilters = ['name', 'gender', 'race', 'ethnicity']
			serviceClientFilters.forEach((filter) => {
				headerFilters.push({
					id: filter,
					name: filter,
					fieldType: 'clientField',
					value: []
				})
			})
		}

		return headerFilters
	}, [])

	const buildServicePageColumns = useCallback(
		(service: Service): IPaginatedListColumn[] => {
			const customFields = service.customFields ?? []

			const getColumnItemValue = (
				answerItem: ServiceAnswers,
				field: ServiceCustomField
			): string => {
				let answerValue = ''

				const answers = answerItem.fieldAnswers?.[field.fieldType]?.find(
					(a) => a.fieldId === field.fieldId
				)
				if (answers) {
					const fieldValue = customFields.find((f) => f.fieldId === answers.fieldId).fieldValue

					if (Array.isArray(answers.values)) {
						answerValue = answers.values
							.map((v) => fieldValue.find((f) => f.id === v).label)
							.join(', ')
					} else {
						switch (field.fieldType) {
							case 'singleChoice':
								answerValue = fieldValue.find((f) => f.id === answers.values).label
								break
							case 'date':
								answerValue = new Date(answers.values).toLocaleDateString(locale)
								break
							default:
								answerValue = answers.values
						}
					}
				} else {
					answerValue = ''
				}

				return answerValue
			}

			const _pageColumns: IPaginatedListColumn[] = []

			if (service.contactFormEnabled) {
				_pageColumns.push(
					{
						key: 'name',
						headerClassName: styles.headerItemCell,
						itemClassName: styles.itemCell,
						name: t('clientList.columns.name'),
						onRenderColumnHeader(key, name, index) {
							return (
								<CustomTextFieldFilter
									filterLabel={name}
									onFilterChanged={(value) => filterColumnTextValue(key, value)}
								/>
							)
						},
						onRenderColumnItem(item: ServiceAnswers, index: number) {
							return `${item?.contacts[0].name?.first} ${item?.contacts[0].name?.last}`
						}
					},
					{
						key: 'gender',
						headerClassName: styles.headerItemCell,
						itemClassName: styles.itemCell,
						name: t('demographics.gender.label'),
						onRenderColumnHeader(key, name, index) {
							return (
								<CustomOptionsFilter
									filterLabel={name}
									placeholder={name}
									options={CLIENT_DEMOGRAPHICS[key].options.map((o) => ({
										key: o.key,
										text: t(`demographics.${key}.options.${o.key}`)
									}))}
									onFilterChanged={(option) => filterColumns(key, option)}
								/>
							)
						},
						onRenderColumnItem(item: ServiceAnswers, index: number) {
							return getDemographicValue('gender', item.contacts[0])
						}
					},
					{
						key: 'race',
						headerClassName: styles.headerItemCell,
						itemClassName: styles.itemCell,
						name: t('demographics.race.label'),
						onRenderColumnHeader(key, name, index) {
							return (
								<CustomOptionsFilter
									filterLabel={name}
									placeholder={name}
									options={CLIENT_DEMOGRAPHICS[key].options.map((o) => ({
										key: o.key,
										text: t(`demographics.${key}.options.${o.key}`)
									}))}
									onFilterChanged={(option) => filterColumns(key, option)}
								/>
							)
						},
						onRenderColumnItem(item: ServiceAnswers, index: number) {
							return getDemographicValue('race', item.contacts[0])
						}
					},
					{
						key: 'ethnicity',
						headerClassName: styles.headerItemCell,
						itemClassName: styles.itemCell,
						name: t('demographics.ethnicity.label'),
						onRenderColumnHeader(key, name, index) {
							return (
								<CustomOptionsFilter
									filterLabel={name}
									placeholder={name}
									options={CLIENT_DEMOGRAPHICS[key].options.map((o) => ({
										key: o.key,
										text: t(`demographics.${key}.options.${o.key}`)
									}))}
									onFilterChanged={(option) => filterColumns(key, option)}
								/>
							)
						},
						onRenderColumnItem(item: ServiceAnswers, index: number) {
							return getDemographicValue('ethnicity', item.contacts[0])
						}
					}
				)
			}

			const customFormColumns: IPaginatedListColumn[] = customFields.map((field, index) => ({
				key: field.fieldId,
				name: field.fieldName,
				headerClassName: styles.headerItemCell,
				itemClassName: styles.itemCell,
				onRenderColumnHeader: function renderColumnHeader(key, name) {
					const dropdownFieldTypes = ['singleChoice', 'multiChoice']
					if (dropdownFieldTypes.includes(field.fieldType)) {
						return (
							<CustomOptionsFilter
								filterLabel={name}
								placeholder={name}
								options={field.fieldValue.map((value) => ({ key: value.id, text: value.label }))}
								onFilterChanged={(option) => filterColumns(key, option)}
							/>
						)
					}

					const textFieldFieldTypes = ['singleText', 'multilineText']
					if (textFieldFieldTypes.includes(field.fieldType)) {
						return (
							<CustomTextFieldFilter
								filterLabel={name}
								onFilterChanged={(value) => filterColumnTextValue(key, value)}
							/>
						)
					}

					if (field.fieldType === 'date') {
						return (
							<CustomDateRangeFilter
								filterLabel={name}
								onFilterChanged={({ startDate, endDate }) => {
									const sDate = startDate ? startDate.toISOString() : ''
									const eDate = endDate ? endDate.toISOString() : ''
									filterRangedValues(key, [sDate, eDate])
								}}
							/>
						)
					}

					if (field.fieldType === 'number') {
						// get min and max values from service answers
						let min = 0
						let max = 0
						service.answers.forEach((answer) => {
							answer.fieldAnswers[field.fieldType]?.forEach((fieldAnswer) => {
								if (fieldAnswer.fieldId === key) {
									const answerNumber = Number(fieldAnswer.values)
									if (answerNumber > max) {
										max = answerNumber
									}
									if (answerNumber < min) {
										min = answerNumber
									}
								}
							})
						})
						return (
							<CustomNumberRangeFilter
								filterLabel={name}
								minValue={min}
								maxValue={max}
								onFilterChanged={(min, max) => {
									filterRangedValues(key, [min.toString(), max.toString()])
								}}
							/>
						)
					}
				},
				onRenderColumnItem: function renderColumnItem(item: ServiceAnswers) {
					if (field.fieldType === 'multilineText') {
						return <ShortString text={getColumnItemValue(item, field)} limit={50} />
					}
					return getColumnItemValue(item, field)
				}
			}))

			const actionColumns: IPaginatedListColumn[] = [
				{
					key: 'actions',
					name: '',
					headerClassName: cx(styles.headerItemCell, styles.actionItemHeader),
					itemClassName: cx(styles.itemCell, styles.actionItemCell),
					onRenderColumnItem(item: ServiceAnswers) {
						const columnActionButtons: IMultiActionButtons<ServiceAnswers>[] = [
							{
								name: t('serviceListRowActions.edit'),
								className: cx(styles.editButton),
								onActionClick: function editRecord(item) {
									setRecordToEdit({ service, record: item })
									openEditRecordPanel()
								}
							},
							{
								name: t('serviceListRowActions.delete'),
								className: cx(styles.editButton),
								onActionClick: function deleteRecord(item) {
									handleDeleteServiceAnswerAction(item, service.id)
								}
							}
						]
						return (
							<div className={styles.actionItemButtonsWrapper}>
								<MultiActionButton columnItem={item} buttonGroup={columnActionButtons} />
							</div>
						)
					}
				}
			]

			return _pageColumns.concat(customFormColumns).concat(actionColumns)
		},
		[
			t,
			locale,
			filterColumnTextValue,
			filterRangedValues,
			filterColumns,
			getDemographicValue,
			openEditRecordPanel
		]
	)

	const buildServiceCSVFields = useCallback(
		(service: Service) => {
			const customFields = service.customFields

			const getColumnItemValue = (
				answerItem: ServiceAnswers,
				field: ServiceCustomField
			): string => {
				let answerValue = ''

				const answers = answerItem.fieldAnswers[field.fieldType]?.find(
					(a) => a.fieldId === field.fieldId
				)
				if (answers) {
					const fieldValue = customFields.find((f) => f.fieldId === answers.fieldId).fieldValue

					if (Array.isArray(answers.values)) {
						answerValue = answers.values
							.map((v) => fieldValue.find((f) => f.id === v).label)
							.join(', ')
					} else {
						switch (field.fieldType) {
							case 'singleChoice':
								answerValue = fieldValue.find((f) => f.id === answers.values).label
								break
							case 'date':
								answerValue = new Date(answers.values).toLocaleDateString(locale)
								break
							default:
								answerValue = answers.values
						}
					}
				} else {
					answerValue = ''
				}

				return answerValue
			}

			setCsvFields(
				customFields.map((field) => {
					return {
						label: field.fieldName,
						value: (item: ServiceAnswers) => {
							return getColumnItemValue(item, field)
						}
					}
				})
			)

			if (service.contactFormEnabled) {
				setCsvFields([
					...[
						{
							label: t('clientList.columns.name'),
							value: (item: ServiceAnswers) => {
								return `${item.contacts[0].name.first} ${item.contacts[0].name.last}`
							}
						},
						{
							label: t('demographics.gender.label'),
							value: (item: ServiceAnswers) => getDemographicValue('gender', item.contacts[0])
						},
						{
							label: t('demographics.race.label'),
							value: (item: ServiceAnswers) => getDemographicValue('race', item.contacts[0])
						},
						{
							label: t('demographics.ethnicity.label'),
							value: (item: ServiceAnswers) => getDemographicValue('ethnicity', item.contacts[0])
						}
					],
					...csvFields
				])
			}
		},
		[locale, t, csvFields, getDemographicValue]
	)

	const loadSelectedService = useCallback(
		(serviceId: string) => {
			if (!serviceId) {
				setFilteredList([])
				setPageColumns([])
				setReportHeaderFilters([])
				setFilters([])
				setUnfilteredList([])
			} else {
				const selectedService = activeServices.find((s) => s.id === serviceId)

				// store unfiltered answers for drill-down filtering
				setUnfilteredList(selectedService?.answers || [])

				const servicePageColumns = buildServicePageColumns(selectedService)
				setPageColumns(servicePageColumns)
				setFilteredList(unfilteredList)
				buildServiceCSVFields(selectedService)
				setFilters(buildServiceFilters(selectedService))
			}
		},
		[
			activeServices,
			unfilteredList,
			buildServicePageColumns,
			buildServiceFilters,
			buildServiceCSVFields
		]
	)
	// #endregion Service Report functions

	// #region Client Report functions
	const buildClientCSVFields = useCallback(() => {
		setCsvFields([
			{
				label: t('clientList.columns.name'),
				value: (item: Contact) => {
					return `${item?.name?.first} ${item?.name?.last}`
				}
			},
			{
				label: t('demographics.gender.label'),
				value: (item: Contact) => getDemographicValue('gender', item)
			},
			{
				label: t('demographics.race.label'),
				value: (item: Contact) => getDemographicValue('race', item)
			},
			{
				label: t('demographics.ethnicity.label'),
				value: (item: Contact) => getDemographicValue('ethnicity', item)
			},
			{
				label: t('customFilters.birthdate'),
				value: (item: Contact) => new Date(item.dateOfBirth).toLocaleDateString(locale)
			},
			{
				label: t('customFilters.city'),
				value: (item: Contact) => item?.address?.city
			},
			{
				label: t('customFilters.state'),
				value: (item: Contact) => item?.address?.state
			},
			{
				label: t('customFilters.zip'),
				value: (item: Contact) => item?.address?.zip
			}
		])
	}, [locale, t, getDemographicValue])

	const buildClientPageColumns = useCallback((): IPaginatedListColumn[] => {
		const _pageColumns: IPaginatedListColumn[] = [
			{
				key: 'name',
				headerClassName: styles.headerItemCell,
				itemClassName: styles.itemCell,
				name: t('clientList.columns.name'),
				onRenderColumnHeader(key, name, index) {
					return (
						<CustomTextFieldFilter
							filterLabel={name}
							onFilterChanged={(value) => filterColumnTextValue(key, value)}
						/>
					)
				},
				onRenderColumnItem(item: Contact, index: number) {
					return `${item.name.first} ${item.name.last}`
				}
			},
			{
				key: 'gender',
				headerClassName: styles.headerItemCell,
				itemClassName: styles.itemCell,
				name: t('demographics.gender.label'),
				onRenderColumnHeader(key, name, index) {
					return (
						<CustomOptionsFilter
							filterLabel={name}
							placeholder={name}
							options={CLIENT_DEMOGRAPHICS[key].options.map((o) => ({
								key: o.key,
								text: t(`demographics.${key}.options.${o.key}`)
							}))}
							onFilterChanged={(option) => filterColumns(key, option)}
						/>
					)
				},
				onRenderColumnItem(item: Contact, index: number) {
					return getDemographicValue('gender', item)
				}
			},
			{
				key: 'race',
				headerClassName: styles.headerItemCell,
				itemClassName: styles.itemCell,
				name: t('demographics.race.label'),
				onRenderColumnHeader(key, name, index) {
					return (
						<CustomOptionsFilter
							filterLabel={name}
							placeholder={name}
							options={CLIENT_DEMOGRAPHICS[key].options.map((o) => ({
								key: o.key,
								text: t(`demographics.${key}.options.${o.key}`)
							}))}
							onFilterChanged={(option) => filterColumns(key, option)}
						/>
					)
				},
				onRenderColumnItem(item: Contact, index: number) {
					return getDemographicValue('race', item)
				}
			},
			{
				key: 'ethnicity',
				headerClassName: styles.headerItemCell,
				itemClassName: styles.itemCell,
				name: t('demographics.ethnicity.label'),
				onRenderColumnHeader(key, name, index) {
					return (
						<CustomOptionsFilter
							filterLabel={name}
							placeholder={name}
							options={CLIENT_DEMOGRAPHICS[key].options.map((o) => ({
								key: o.key,
								text: t(`demographics.${key}.options.${o.key}`)
							}))}
							onFilterChanged={(option) => filterColumns(key, option)}
						/>
					)
				},
				onRenderColumnItem(item: Contact, index: number) {
					return getDemographicValue('ethnicity', item)
				}
			},
			{
				key: 'dateOfBirth',
				headerClassName: styles.headerItemCell,
				itemClassName: styles.itemCell,
				name: t('customFilters.birthdate'),
				onRenderColumnHeader(key, name, index) {
					const birthDateLimit = new Date()
					return (
						<CustomDateRangeFilter
							filterLabel={name}
							minStartDate={birthDateLimit}
							maxEndDate={birthDateLimit}
							onFilterChanged={({ startDate, endDate }) => {
								const sDate = startDate ? startDate.toISOString() : ''
								const eDate = endDate ? endDate.toISOString() : ''
								filterRangedValues(key, [sDate, eDate])
							}}
						/>
					)
				},
				onRenderColumnItem(item: Contact, index: number) {
					return new Date(item.dateOfBirth).toLocaleDateString(locale)
				}
			},
			{
				key: 'city',
				headerClassName: styles.headerItemCell,
				itemClassName: styles.itemCell,
				name: t('customFilters.city'),
				onRenderColumnHeader(key, name, index) {
					return (
						<CustomTextFieldFilter
							filterLabel={name}
							onFilterChanged={(value) => filterColumnTextValue(key, value)}
						/>
					)
				},
				onRenderColumnItem(item: Contact, index: number) {
					return item?.address?.city
				}
			},
			{
				key: 'county',
				headerClassName: styles.headerItemCell,
				itemClassName: styles.itemCell,
				name: t('customFilters.county'),
				onRenderColumnHeader(key, name, index) {
					return (
						<CustomTextFieldFilter
							filterLabel={name}
							onFilterChanged={(value) => filterColumnTextValue(key, value)}
						/>
					)
				},
				onRenderColumnItem(item: Contact, index: number) {
					return item?.address?.county
				}
			},
			{
				key: 'state',
				headerClassName: styles.headerItemCell,
				itemClassName: styles.itemCell,
				name: t('customFilters.state'),
				onRenderColumnHeader(key, name, index) {
					return (
						<CustomTextFieldFilter
							filterLabel={name}
							onFilterChanged={(value) => filterColumnTextValue(key, value)}
						/>
					)
				},
				onRenderColumnItem(item: Contact, index: number) {
					return item?.address?.state
				}
			},
			{
				key: 'zip',
				headerClassName: styles.headerItemCell,
				itemClassName: styles.itemCell,
				name: t('customFilters.zip'),
				onRenderColumnHeader(key, name, index) {
					return (
						<CustomTextFieldFilter
							filterLabel={name}
							onFilterChanged={(value) => filterColumnTextValue(key, value)}
						/>
					)
				},
				onRenderColumnItem(item: Contact, index: number) {
					return item?.address?.zip
				}
			}
		]

		return _pageColumns
	}, [filterColumnTextValue, filterRangedValues, locale, t, getDemographicValue, filterColumns])

	const buildClientFilters = useCallback((): IFieldFilter[] => {
		const headerFilters: IFieldFilter[] = []
		const clientFilters = [
			'name',
			'gender',
			'race',
			'ethnicity',
			'dateOfBirth',
			'city',
			'county',
			'state',
			'zip'
		]
		clientFilters.forEach((filter) => {
			headerFilters.push({
				id: filter,
				name: filter,
				fieldType: 'clientField',
				value: []
			})
		})

		return headerFilters
	}, [])

	const loadClients = useCallback(() => {
		setUnfilteredList(activeClients)
		setFilteredList(activeClients)

		const clientsPageColumns = buildClientPageColumns()
		setPageColumns(clientsPageColumns)
		buildClientCSVFields()
		setFilters(buildClientFilters())
	}, [
		activeClients,
		buildClientPageColumns,
		buildClientCSVFields,
		buildClientFilters,
		setPageColumns
	])
	// #endregion Client Report functions

	const unloadReportData = useCallback(() => {
		setFilteredList([])
		setPageColumns([])
		setReportHeaderFilters([])
		setReportFilterOption(undefined)
		setUnfilteredList([])
		setFilters([])
	}, [])

	const loadReportData = useCallback(
		(value: ReportTypes) => {
			setReportType(value)

			if (!value) {
				unloadReportData()
				setIsInitialLoad(false)
			}

			if (value === ReportTypes.SERVICES) {
				unloadReportData()
				const filterOptions: FilterOptions = {
					options: activeServices.map((service) => ({
						label: service.name,
						value: service.id
					})),
					onChange: (option: OptionType) => loadSelectedService(option?.value)
				}
				setReportFilterOption(filterOptions)
			}

			if (value === ReportTypes.CLIENTS) {
				unloadReportData()
				setReportFilterOption(undefined)
				loadClients()
			}
		},
		[setIsInitialLoad, activeServices, loadSelectedService, loadClients, unloadReportData]
	)

	useEffect(() => {
		setActiveServices(
			serviceList.filter((service) => service.serviceStatus !== ServiceStatus.Archive)
		)
	}, [serviceList, setActiveServices])

	useEffect(() => {
		setActiveClients(contacts.filter((c) => c.status !== ContactStatus.Archived))
	}, [contacts, setActiveClients])

	useEffect(() => {
		if (isInitialLoad && !reportType) {
			loadReportData(ReportTypes.CLIENTS)
		}
	}, [isInitialLoad, reportType, loadReportData])

	const reportListOptions: FilterOptions = {
		options: [
			{ label: t('clientsTitle'), value: ReportTypes.CLIENTS },
			{ label: t('servicesTitle'), value: ReportTypes.SERVICES }
		],
		onChange: (option: OptionType) => loadReportData(option?.value)
	}

	const downloadCSV = () => {
		const csvParser = new Parser({ fields: csvFields })
		const csv = csvParser.parse(filteredList)
		const csvData = new Blob([csv], { type: 'text/csv' })
		const csvURL = URL.createObjectURL(csvData)
		window.open(csvURL)
	}

	return (
		<ClientOnly>
			<div className={cx('mt-5 mb-5', styles.serviceList)}>
				<PaginatedList
					title={title}
					className={styles.reportList}
					reportOptions={reportListOptions}
					list={filteredList}
					itemsPerPage={10}
					columns={pageColumns}
					tableClassName={styles.reportTable}
					headerRowClassName={styles.headerRow}
					bodyRowClassName={styles.bodyRow}
					paginatorContainerClassName={styles.paginatorContainer}
					filterOptions={reportFilterOption}
					isLoading={loading}
					exportButtonName={t('exportButton')}
					onExportDataButtonClick={() => downloadCSV()}
					//resetFiltersButtonName={'Clear all filters'}
					//onResetFiltersClick={() => resetFilters()}
				/>
				<DeleteServiceRecordModal
					showModal={showModal}
					onSubmit={handleConfirmDelete}
					onDismiss={() => setShowModal(false)}
				/>
			</div>
			<Panel openPanel={isEditRecordOpen} onDismiss={() => dismissEditRecordPanel()}>
				<FormGenerator
					service={recordToEdit?.service}
					record={recordToEdit?.record}
					previewMode={false}
					editMode={true}
					onSubmit={(values) => handleUpdateServiceAnswer(values)}
				/>
			</Panel>
		</ClientOnly>
	)
})
export default wrap(ReportList)
