//-- React
import { useState, type JSX } from 'react';
//-- Icons
import { Pencil, Trash2, Copy, MoreVertical, CheckCircle2 } from 'lucide-react';
//-- Components
import { Modal, useToast, Dropdown } from './index';
/**
 * ReactIslandsGallery — React islands gallery component.
 * @description Only used for demo purposes.
 * @returns {JSX.Element} The rendered ReactIslandsGallery component.
 */
export default function GalleryIslands(): JSX.Element {
    const [basicOpen, setBasicOpen] = useState(false);
    const [dangerOpen, setDangerOpen] = useState(false);
    const [largeOpen, setLargeOpen] = useState(false);
    const toast = useToast({ position: 'bottom-right' });

    return (
        <div className="islands">
            <section className="islands__group">
                <h2>Modal</h2>
                <div className="islands__row">
                    <button
                        type="button"
                        className="btn btn-primary btn-md"
                        onClick={() => setBasicOpen(true)}
                    >
                        Open basic modal
                    </button>
                    <button
                        type="button"
                        className="btn btn-destructive btn-md"
                        onClick={() => setDangerOpen(true)}
                    >
                        Open danger modal
                    </button>
                    <button
                        type="button"
                        className="btn btn-secondary btn-md"
                        onClick={() => setLargeOpen(true)}
                    >
                        Open large modal
                    </button>
                </div>

                <Modal
                    open={basicOpen}
                    onClose={() => setBasicOpen(false)}
                    title="Edit device"
                    footer={
                        <>
                            <button
                                type="button"
                                className="btn btn-secondary btn-md"
                                onClick={() => setBasicOpen(false)}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary btn-md"
                                onClick={() => setBasicOpen(false)}
                            >
                                Save changes
                            </button>
                        </>
                    }
                >
                    <p>
                        Make changes to your device configuration. Changes take
                        effect immediately after saving.
                    </p>
                    <div style={{ marginTop: '12px' }}>
                        <label className="input-label" htmlFor="m-name">
                            Device name
                        </label>
                        <input
                            id="m-name"
                            className="input"
                            defaultValue="Delivery Van #3"
                        />
                    </div>
                </Modal>

                <Modal
                    variant="danger"
                    open={dangerOpen}
                    onClose={() => setDangerOpen(false)}
                    title="Delete device?"
                    footer={
                        <>
                            <button
                                type="button"
                                className="btn btn-secondary btn-md"
                                onClick={() => setDangerOpen(false)}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn btn-destructive btn-md"
                                onClick={() => {
                                    setDangerOpen(false);
                                    toast.push({
                                        variant: 'success',
                                        title: 'Device deleted',
                                    });
                                }}
                            >
                                Delete device
                            </button>
                        </>
                    }
                >
                    <p>
                        Are you sure you want to delete <strong>Delivery Van #3</strong>?
                        This action cannot be undone. All location history will be
                        permanently removed.
                    </p>
                </Modal>

                <Modal
                    size="lg"
                    open={largeOpen}
                    onClose={() => setLargeOpen(false)}
                    title="Grant access to user"
                >
                    <p>
                        Search for a user and assign them a role on this device.
                        Owners can manage access; editors can update; viewers are
                        read-only.
                    </p>
                </Modal>
            </section>

            <section className="islands__group">
                <h2>Toast</h2>
                <div className="islands__row">
                    <button
                        type="button"
                        className="btn btn-primary btn-md"
                        onClick={() =>
                            toast.push({
                                variant: 'success',
                                title: 'Device saved',
                                message: 'Changes applied successfully.',
                            })
                        }
                    >
                        Success
                    </button>
                    <button
                        type="button"
                        className="btn btn-destructive btn-md"
                        onClick={() =>
                            toast.push({
                                variant: 'error',
                                title: 'Failed to save',
                                message: 'Network error — please retry.',
                            })
                        }
                    >
                        Error
                    </button>
                    <button
                        type="button"
                        className="btn btn-secondary btn-md"
                        onClick={() =>
                            toast.push({
                                variant: 'warning',
                                title: 'Battery low',
                                message: 'Delivery Van #3 at 12%.',
                            })
                        }
                    >
                        Warning
                    </button>
                    <button
                        type="button"
                        className="btn btn-ghost btn-md"
                        onClick={() =>
                            toast.push({
                                variant: 'info',
                                title: 'New location received',
                            })
                        }
                    >
                        Info
                    </button>
                    <button
                        type="button"
                        className="btn btn-outline btn-md"
                        onClick={() =>
                            toast.push({
                                variant: 'success',
                                title: 'Undo last action',
                                message: 'You can revert this change.',
                                action: {
                                    label: 'Undo',
                                    onClick: () =>
                                        toast.push({
                                            variant: 'info',
                                            title: 'Action undone',
                                        }),
                                },
                            })
                        }
                    >
                        With action
                    </button>
                </div>
            </section>

            <section className="islands__group">
                <h2>Dropdown</h2>
                <div className="islands__row">
                    <Dropdown
                        trigger="Actions"
                        items={[
                            {
                                key: 'edit',
                                label: 'Edit',
                                icon: <Pencil size={14} />,
                                onSelect: () =>
                                    toast.push({
                                        variant: 'info',
                                        title: 'Edit clicked',
                                    }),
                            },
                            {
                                key: 'duplicate',
                                label: 'Duplicate',
                                icon: <Copy size={14} />,
                                onSelect: () =>
                                    toast.push({
                                        variant: 'success',
                                        title: 'Duplicated',
                                    }),
                            },
                            {
                                key: 'delete',
                                label: 'Delete',
                                icon: <Trash2 size={14} />,
                                destructive: true,
                                onSelect: () =>
                                    toast.push({
                                        variant: 'error',
                                        title: 'Deleted',
                                    }),
                            },
                        ]}
                    />
                    <Dropdown
                        align="end"
                        trigger={
                            <span
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                }}
                            >
                                <MoreVertical size={14} />
                                More
                            </span>
                        }
                        sections={[
                            {
                                key: 's1',
                                items: [
                                    {
                                        key: 'view',
                                        label: 'View details',
                                        icon: <CheckCircle2 size={14} />,
                                        onSelect: () =>
                                            toast.push({
                                                variant: 'info',
                                                title: 'Viewing details',
                                            }),
                                    },
                                    {
                                        key: 'export',
                                        label: 'Export CSV',
                                        onSelect: () =>
                                            toast.push({
                                                variant: 'success',
                                                title: 'Exported',
                                            }),
                                    },
                                ],
                            },
                            {
                                key: 's2',
                                items: [
                                    {
                                        key: 'disabled',
                                        label: 'Disabled option',
                                        disabled: true,
                                    },
                                    {
                                        key: 'revoke',
                                        label: 'Revoke access',
                                        destructive: true,
                                        icon: <Trash2 size={14} />,
                                        onSelect: () =>
                                            toast.push({
                                                variant: 'warning',
                                                title: 'Access revoked',
                                            }),
                                    },
                                ],
                            },
                        ]}
                    />
                </div>
            </section>

            <toast.Container />
        </div>
    );
}
